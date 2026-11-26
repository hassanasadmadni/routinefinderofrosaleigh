import { BUNDLES, PRODUCTS, type BundleId, type ProductId } from "@/data/catalogue";
import type { QuizAnswers } from "@/data/quiz";
import { describeReadings, type PhotoReadings } from "./skin-scan";

export interface RoutineStep {
  productId: ProductId;
  /** Why this step is in the routine, for this person */
  reason: string;
  /** A personalised tip from the product's directions, where relevant */
  tip?: string;
}

export interface SkinResult {
  createdAt: number;
  answers: QuizAnswers;
  source: "photo" | "quiz";
  summary: string[];
  am: RoutineStep[];
  pm: RoutineStep[];
  bundleId: BundleId;
  seed?: string;
  /** Measurements taken from the customer's photo, when they used the scan */
  readings?: PhotoReadings;
  /** True when the customer chose their own steps instead of the recommendation */
  custom?: boolean;
}

/** Every step the routine can contain, in the order Rosaleigh recommends. */
export const ROUTINE_ORDER: Record<"am" | "pm", ProductId[]> = {
  am: ["face-wash", "strips", "day-cream"],
  pm: ["cleanser", "face-wash", "night-cream"],
};

const ADDED_STEP: Record<"am" | "pm", Partial<Record<ProductId, RoutineStep>>> = {
  am: {
    "face-wash": {
      productId: "face-wash",
      reason: "You added a morning cleanse.",
      tip: "Sensitive skin often does better with just a water rinse in the morning, so notice how your skin feels and drop this step if it feels tight.",
    },
    strips: { productId: "strips", reason: "You added the inside-out step: one strip a day.", tip: "No water needed. Let it dissolve fully under your tongue." },
    "day-cream": { productId: "day-cream", reason: "Daily SPF50, always the last morning step.", tip: "Use a full two finger-lengths; using less reduces protection." },
  },
  pm: {
    cleanser: { productId: "cleanser", reason: "The first cleanse melts away SPF and make-up.", tip: "Warm the balm between your fingertips first." },
    "face-wash": { productId: "face-wash", reason: "The second cleanse clears what's left.", tip: "Rinse with lukewarm, not hot, water." },
    "night-cream": { productId: "night-cream", reason: "Your overnight moisturiser.", tip: "Let it absorb fully before lying down." },
  },
};

/**
 * The customer's own routine: the steps they picked, kept in the recommended
 * order. Steps that were also recommended keep their personalised advice.
 */
export function customiseRoutine(base: SkinResult, picks: { am: ProductId[]; pm: ProductId[] }): SkinResult {
  const build = (when: "am" | "pm") =>
    ROUTINE_ORDER[when]
      .filter((id) => picks[when].includes(id))
      .map((id) => base[when].find((s) => s.productId === id) ?? ADDED_STEP[when][id]!)
      .filter(Boolean);
  return { ...base, am: build("am"), pm: build("pm"), custom: true, createdAt: Date.now() };
}

export interface AnalyzeInput {
  answers: QuizAnswers;
  source: "photo" | "quiz";
  seed?: string | undefined;
  /** Not stored or sent anywhere; kept for API compatibility. */
  imageDataUrl?: string | undefined;
  readings?: PhotoReadings | undefined;
}

/** Stable 32-bit string hash — same input always yields the same output. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simulated photo analysis: deterministic answers derived from the uploaded
 * file's signature, so the same photo always produces the same result.
 */
export function answersFromSeed(seed: string): QuizAnswers {
  const rand = mulberry(hashString(seed));
  const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)]!;
  return {
    age: pick(["25-34", "25-34", "35-44", "35-44", "45-54", "18-24", "55+"]),
    skinType: pick(["dry", "oily", "combination", "combination", "normal", "sensitive"]),
    hydration: pick(["tight", "balanced", "balanced", "oily"]),
    concern: pick(["lines", "dullness", "dryness", "texture", "firmness"]),
    routine: pick(["none", "basic", "basic", "full"]),
    spf: pick(["daily", "sometimes", "sometimes", "rarely"]),
  };
}

export interface SkinMetrics {
  score: number;
  band: "Needs care" | "Fair" | "Good" | "Excellent";
  tone: "error" | "highlight" | "success";
  skinType: string;
  hydration: "Low" | "Balanced" | "High";
  concern: string;
}

const TYPE_TITLE: Record<string, string> = {
  dry: "Dry",
  oily: "Oily",
  combination: "Combination",
  normal: "Normal",
  sensitive: "Sensitive",
};

const CONCERN_TITLE: Record<string, string> = {
  lines: "Fine lines",
  dullness: "Dullness",
  dryness: "Dryness",
  texture: "Uneven texture",
  firmness: "Loss of firmness",
};

export function metricsFor(result: SkinResult): SkinMetrics {
  const a = result.answers;
  let score = 74;
  if (a.spf === "daily") score += 8;
  else if (a.spf === "rarely") score -= 8;
  if (a.routine === "full") score += 4;
  else if (a.routine === "none") score -= 6;
  if (a.hydration === "balanced") score += 5;
  else if (a.hydration === "tight") score -= 6;
  if (a.skinType === "normal") score += 3;
  else if (a.skinType === "sensitive" || a.skinType === "dry") score -= 4;
  if (a.concern === "lines" || a.concern === "firmness") score -= 4;
  if (a.age === "45-54") score -= 2;
  else if (a.age === "55+") score -= 4;
  else if (a.age === "18-24") score += 3;
  score += Math.floor(mulberry(hashString(result.seed ?? JSON.stringify(a)))() * 5) - 2;
  score = Math.max(38, Math.min(96, score));

  const band: SkinMetrics["band"] =
    score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 55 ? "Fair" : "Needs care";
  const tone: SkinMetrics["tone"] =
    score >= 70 ? "success" : score >= 55 ? "highlight" : "error";

  return {
    score,
    band,
    tone,
    skinType: TYPE_TITLE[a.skinType] ?? "Balanced",
    hydration: a.hydration === "tight" ? "Low" : a.hydration === "oily" ? "High" : "Balanced",
    concern: CONCERN_TITLE[a.concern] ?? "Overall skin health",
  };
}

const SKIN_TYPE_LABEL: Record<string, string> = {
  dry: "dry",
  oily: "oily",
  combination: "combination",
  normal: "normal",
  sensitive: "sensitive",
};

const CONCERN_LABEL: Record<string, string> = {
  lines: "fine lines and early creasing",
  dullness: "a lack of natural radiance",
  dryness: "persistent dryness",
  texture: "uneven texture",
  firmness: "a softening of firmness",
};

function pickBundle(_a: QuizAnswers): BundleId {
  return "complete-routine";
}

function buildRoutine(a: QuizAnswers, _bundleId: BundleId) {
  const sensitive = a.skinType === "sensitive";
  const oily = a.skinType === "oily" || a.hydration === "oily";
  const dry = a.skinType === "dry" || a.hydration === "tight" || a.concern === "dryness";
  const lowSpf = a.spf !== "daily";

  const am: RoutineStep[] = [];
  // Store guidance: sensitive skin uses the face wash once daily (evening) and rinses with water in the morning.
  if (!sensitive) {
    am.push({
      productId: "face-wash",
      reason: "A quick, gentle cleanse to start the day and prepare skin for your SPF.",
      tip: oily
        ? "Focus the lather on your T-zone, where oil builds up most."
        : "Cleanse all over with lukewarm water, then pat dry.",
    });
  }
  am.push({
    productId: "strips",
    reason: "Your inside-out step: one strip a day, taken with your morning routine so it becomes a habit.",
    tip: "No water needed. Let it dissolve fully under your tongue.",
  });
  am.push({
    productId: "day-cream",
    reason: lowSpf
      ? "Daily sun protection is the single habit we'd most encourage. This is always the last step of your morning."
      : "You already wear SPF daily. This keeps that habit, with AGEN™, Niacinamide and Hyaluronic Acid built in.",
    tip: lowSpf
      ? "Make it a daily habit, even on cloudy days. A full two finger-lengths; using less reduces protection."
      : dry
        ? "If your skin feels very dry, you can layer it over your usual moisturiser. Use a full two finger-lengths."
        : "Use a full two finger-lengths and give it 2–3 minutes before make-up.",
  });

  const pm: RoutineStep[] = [
    {
      productId: "cleanser",
      reason:
        a.spf === "daily" || a.routine === "full"
          ? "The first step of your double cleanse: it melts away SPF and make-up that a wash alone can leave behind."
          : "The first step of your double cleanse: it melts away the day's SPF, make-up and build-up.",
      tip:
        a.routine === "none"
          ? "Take your time. Massage for about a minute before adding water."
          : "Warm the balm between your fingertips first so it melts easily.",
    },
    {
      productId: "face-wash",
      reason: sensitive
        ? "Your one face wash of the day. Sensitive skin does best cleansing once, in the evening."
        : "The second cleanse clears what's left, so your Night Cream goes onto clean skin.",
      tip: sensitive
        ? "Your only face wash of the day. In the morning, simply rinse with water."
        : oily
          ? "Focus on your T-zone."
          : "Rinse with lukewarm, not hot, water.",
    },
    {
      productId: "night-cream",
      reason:
        a.concern === "lines" || a.concern === "firmness"
          ? "Your overnight step for firmness: NMN and PDRN help skin look firmer and more youthful by morning."
          : "Your overnight moisturiser: soluble collagen and peptides leave skin soft and supple by morning.",
      tip:
        a.skinType === "combination"
          ? "Start with a smaller amount and build up as your skin adjusts."
          : dry
            ? "Once or twice a week, apply a slightly thicker layer for a richer feel."
            : "Let it absorb fully before lying down.",
    },
  ];

  return { am, pm };
}

function buildSummary(a: QuizAnswers, readings?: PhotoReadings): string[] {
  const type = SKIN_TYPE_LABEL[a.skinType] ?? "balanced";
  const hydration =
    a.hydration === "tight"
      ? "your skin is telling us it's short on moisture"
      : a.hydration === "oily"
        ? "your skin produces plenty of its own oil, though that isn't the same as being hydrated"
        : "your hydration levels look comfortably balanced";

  const lines = [
    `You have ${type} skin, and ${hydration}.`,
    `Your main focus is ${CONCERN_LABEL[a.concern] ?? "overall skin health"}. Consistency matters more than adding more products.`,
    a.routine === "unspecified"
      ? null
      : a.routine === "none"
      ? "You're starting from scratch, so we've kept every step simple and explained exactly how to do it."
      : a.routine === "basic"
        ? "You already cleanse and moisturise. We've added a proper evening double cleanse and daily SPF."
        : "You're used to a fuller routine, so each Rosaleigh step has a clear job and a clear place in the order.",
  ].filter((l): l is string => Boolean(l));

  if (readings) {
    const d = describeReadings(readings);
    const shine = d.find((x) => x.key === "shine")!;
    const red = d.find((x) => x.key === "redness")!;
    lines.push(
      `Your photo showed ${shine.verdict.toLowerCase()} shine in the T-zone and ${red.verdict.toLowerCase()} redness on the cheeks. We've used that, with your answers, to fine-tune the advice.`,
    );
  }

  if (a.skinType === "sensitive") {
    lines.push("Because your skin is sensitive, you'll use the Face Wash once a day, in the evening, and simply rinse with water in the morning.");
  }
  if (a.spf !== "daily") {
    lines.push("Daily sun protection is the one habit we'd most encourage. SPF50 is always your last morning step.");
  } else {
    lines.push("Wearing SPF daily is already doing a great deal of quiet work for you.");
  }

  return lines;
}

/**
 * Single entry point for skin analysis.
 * Phase 1: derived entirely from quiz answers (photo is validated, never diagnosed).
 * Swap the body for a vision-model call later without touching the UI.
 */
export function analyzeSkin(input: AnalyzeInput): SkinResult {
  const bundleId = pickBundle(input.answers);
  const { am, pm } = buildRoutine(input.answers, bundleId);
  return {
    createdAt: Date.now(),
    answers: input.answers,
    source: input.source,
    summary: buildSummary(input.answers, input.readings),
    am,
    pm,
    bundleId,
    ...(input.seed ? { seed: input.seed } : {}),
    ...(input.readings ? { readings: input.readings } : {}),
  };
}

export const STORAGE_KEY = "rosaleigh.skin-analysis.v2";

export function loadResult(): SkinResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SkinResult;
    return parsed?.bundleId && BUNDLES[parsed.bundleId] && [...parsed.am, ...parsed.pm].every((s) => s.productId in PRODUCTS)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function saveResult(result: SkinResult) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    /* storage unavailable — result simply isn't remembered */
  }
}

export function clearResult() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

export { BUNDLES, PRODUCTS };