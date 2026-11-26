import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, ArrowUpRight, Camera, ChevronDown, ChevronLeft, ChevronRight, Clock, Moon, Sun } from "lucide-react";
import { BRAND_IMAGES, PRODUCTS, type ProductId } from "@/data/catalogue";
import { PRODUCT_GUIDE } from "@/data/routine-guide";
import { analyzeSkin } from "@/lib/analysis";
import { routineSteps } from "@/lib/plan";
import type { QuizAnswers } from "@/data/quiz";
import { ProductTile, Reveal, StorePhoto } from "./Brand";
import { DailyTimeChart, MonthPlan } from "./Viz";
import { ScanHero, ScanSteps } from "./ScanHero";
import { ScrubVideo } from "./ScrubVideo";
import { Science } from "./Science";
import { ROUTINE_FILMS } from "@/data/films";

interface Props {
  onChoose: (path: "photo" | "quiz") => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── The day, in the order rosaleigh.co.uk recommends ─────────────────────── */

interface StoryStep {
  id: ProductId;
  when: "AM" | "PM";
  title: string;
  moment: string;
}

const STORY: StoryStep[] = [
  { id: "face-wash", when: "AM", title: "Wake-up cleanse", moment: "As you start the day" },
  { id: "strips", when: "AM", title: "Inside-out", moment: "With your morning routine" },
  { id: "day-cream", when: "AM", title: "Protect", moment: "Always the last morning step" },
  { id: "cleanser", when: "PM", title: "First cleanse", moment: "As the day ends" },
  { id: "face-wash", when: "PM", title: "Second cleanse", moment: "Straight after the balm" },
  { id: "night-cream", when: "PM", title: "Overnight", moment: "The last thing before bed" },
];

const BASE_ANSWERS: QuizAnswers = {
  age: "35-44",
  skinType: "normal",
  hydration: "balanced",
  concern: "lines",
  routine: "basic",
  spf: "daily",
};

export function Landing({ onChoose }: Props) {
  return (
    <div className="pb-6">
      <ScanHero onChoose={onChoose} />
      <ScanSteps />
      <DayStory />
      <DayStoryMobile />
      <Personaliser />
      <Ingredients />
      <Science />
      <FirstMonth />
      <StartOptions onChoose={onChoose} />
      <Faq />
    </div>
  );
}

/* ── A day with Rosaleigh: scroll-driven story (desktop) ─────────────────── */

const SKY = {
  stops: [0, 0.083, 0.25, 0.417, 0.5, 0.583, 0.75, 0.917, 1],
  colors: ["#FDE7D8", "#FDE7D8", "#FEF3E3", "#FBEBD2", "#7C6E8E", "#2E3360", "#232A52", "#151A35", "#151A35"],
};

function DayStory() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scene3d = useScene3D();
  const [i, setI] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setI(Math.min(STORY.length - 1, Math.max(0, Math.floor(v * STORY.length))));
  });
  const bg = useTransform(scrollYProgress, SKY.stops, SKY.colors);
  // 0→1 progress through the current step, for scroll-linked depth.
  const local = useTransform(scrollYProgress, (v) => {
    const x = v * STORY.length;
    return Math.min(1, Math.max(0, x - Math.min(STORY.length - 1, Math.floor(x))));
  });
  const photoScale = useTransform(local, [0, 1], [1.1, 1]);
  const photoY = useTransform(local, [0, 1], ["-3%", "3%"]);
  const lifeY = useTransform(local, [0, 1], [50, -40]);
  const ghostY = useTransform(local, [0, 1], [30, -30]);
  const prev = useRef(0);
  const [from, setFrom] = useState({ prev: 0, dir: 1 });
  useEffect(() => {
    if (prev.current !== i) {
      setFrom({ prev: prev.current, dir: i > prev.current ? 1 : -1 });
      prev.current = i;
    }
  }, [i]);
  const night = i >= 3;
  const step = STORY[i]!;
  const product = PRODUCTS[step.id];
  const guide = PRODUCT_GUIDE[step.id];

  const jump = (k: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((k + 0.5) / STORY.length) * travel, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-label="A day with Rosaleigh" className="mt-24 hidden md:block">
      <Reveal className="mx-auto max-w-[1300px] px-7">
        <div className="flex items-end justify-between gap-10">
          <div>
            <p className="rl-eyebrow">A day with Rosaleigh</p>
            <h2 className="mt-3 max-w-2xl text-6xl leading-[1.02]">
              Five products. Six steps. <em className="italic text-highlight">One simple order.</em>
            </h2>
          </div>
          <p className="max-w-sm pb-2 text-sm leading-relaxed text-muted-foreground">
            This is the routine as Rosaleigh recommends it, step by step. Scroll through your day,
            from the first cleanse to the last thing before bed.
          </p>
        </div>
      </Reveal>

      <div ref={ref} className="relative mt-10" style={{ height: `${STORY.length * 85}vh` }}>
        <motion.div className="sticky top-0 flex h-screen flex-col overflow-hidden" style={{ backgroundColor: bg }}>
          {scene3d && <Scene3DSlot progress={scrollYProgress} />}
          <div
            className={`relative z-10 mx-auto grid w-full max-w-[1300px] flex-1 grid-cols-[1fr_1.05fr] items-center gap-14 px-7 pt-10 transition-colors duration-700 ${
              night ? "text-white" : "text-ink"
            }`}
          >
            {/* Left: words */}
            <div className="relative">
              {!scene3d && <SunMoon progress={scrollYProgress} night={night} />}
              <AnimatePresence mode="wait">
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="mt-6"
                >
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${night ? "text-accent-yellow" : "text-highlight"}`}>
                    {step.when === "AM" ? "Morning" : "Evening"} · Step {i < 3 ? i + 1 : i - 2} of 3 · {step.moment}
                  </p>
                  <h3 className={`mt-3 text-[4.2rem] leading-[0.95] ${night ? "!text-white" : "!text-ink"}`}>
                    {step.title.split(" ").map((w, n) => (
                      <span key={w + n} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                        <motion.span
                          className="inline-block"
                          initial={reduce ? false : { y: "105%", rotate: 4 }}
                          animate={{ y: "0%", rotate: 0 }}
                          transition={{ duration: 0.7, delay: 0.05 + n * 0.08, ease: EASE }}
                        >
                          {w}&nbsp;
                        </motion.span>
                      </span>
                    ))}
                  </h3>
                  <p className={`mt-3 text-lg font-medium ${night ? "text-white/90" : "text-heading"}`}>{product.shortName}</p>
                  <motion.div
                    className="mt-5 flex flex-wrap gap-2"
                    initial={reduce ? false : "hide"}
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
                  >
                    {[
                      guide.quantity,
                      guide.wait ? `Wait ${guide.wait}` : null,
                      product.role,
                    ]
                      .filter((c): c is string => Boolean(c))
                      .map((c) => (
                        <motion.span
                          key={c}
                          variants={{ hide: { opacity: 0, y: 10, scale: 0.92 }, show: { opacity: 1, y: 0, scale: 1 } }}
                          transition={{ duration: 0.4, ease: EASE }}
                        >
                          <Chip night={night}>
                            {c.startsWith("Wait") && <Clock className="h-3.5 w-3.5" />}
                            {c}
                          </Chip>
                        </motion.span>
                      ))}
                  </motion.div>
                  <ol className="mt-6 space-y-2.5">
                    {guide.steps.map((line, n) => (
                      <motion.li
                        key={line}
                        initial={reduce ? false : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.15 + n * 0.07, ease: EASE }}
                        className={`flex gap-3 text-[15px] leading-relaxed ${night ? "text-white/80" : "text-foreground"}`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            night ? "bg-white/15 text-white" : "bg-ink text-white"
                          }`}
                        >
                          {n + 1}
                        </span>
                        {line}
                      </motion.li>
                    ))}
                  </ol>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-7 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-[6px] ${
                      night ? "text-white decoration-white/30 hover:decoration-white" : "text-ink decoration-ink/25 hover:decoration-ink"
                    }`}
                  >
                    View {product.shortName} <ArrowUpRight className="h-4 w-4" />
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: photography */}
            <div className="relative mx-auto aspect-[4/5] h-[min(68vh,620px)] [perspective:1400px]">
              {/* step number, drifting behind the photo */}
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={`ghost-${i}`}
                  aria-hidden="true"
                  initial={reduce ? false : { opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  style={reduce ? undefined : { y: ghostY }}
                  className={`pointer-events-none absolute -right-24 -top-16 select-none font-display text-[11rem] leading-none ${
                    night ? "text-white/[0.07]" : "text-ink/[0.06]"
                  }`}
                >
                  0{i + 1}
                </motion.span>
              </AnimatePresence>
              {STORY.map((s, k) => {
                const p = PRODUCTS[s.id];
                const on = k === i;
                const leaving = k === from.prev && !on;
                const FULL = "inset(0% 0% 0% 0% round 32px)";
                const SHUT = from.dir > 0 ? "inset(100% 0% 0% 0% round 32px)" : "inset(0% 0% 100% 0% round 32px)";
                return (
                  <motion.div
                    key={`${s.id}-${s.when}`}
                    className="absolute inset-0 overflow-hidden rounded-[32px] shadow-[0_50px_90px_-45px_rgba(0,0,0,0.55)]"
                    style={{ zIndex: on ? 3 : leaving ? 2 : 1 }}
                    initial={false}
                    animate={
                      reduce
                        ? { opacity: on ? 1 : 0 }
                        : on
                          ? { clipPath: FULL, opacity: 1, rotateY: 0 }
                          : leaving
                            ? { clipPath: FULL, opacity: [1, 1, 0], rotateY: from.dir * -6 }
                            : { clipPath: SHUT, opacity: 0, rotateY: 0 }
                    }
                    transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
                    aria-hidden={!on}
                  >
                    {ROUTINE_FILMS[k] ? (
                      <ScrubVideo
                        src={ROUTINE_FILMS[k]!}
                        progress={scrollYProgress}
                        start={k / STORY.length}
                        end={(k + 1) / STORY.length}
                        active={on}
                        reduce={reduce}
                        label={`${s.title}: using ${p.shortName}`}
                      />
                    ) : (
                      <motion.div className="h-full w-full" style={on && !reduce ? { scale: photoScale, y: photoY } : undefined}>
                        <StorePhoto
                          file={p.photo}
                          alt={p.name}
                          tone={p.photoTone}
                          sizes="(min-width: 768px) 40vw, 100vw"
                          widths={[600, 900, 1200]}
                          className="h-full w-full"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              <AnimatePresence>
                {product.lifestyle && !ROUTINE_FILMS[i] && (
                  <motion.div
                    key={`life-${i}`}
                    initial={reduce ? false : { opacity: 0, x: -70, rotate: -12, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, rotate: -4, scale: 1 }}
                    exit={{ opacity: 0, x: -30, rotate: -8, transition: { duration: 0.3 } }}
                    transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.25 }}
                    style={reduce ? undefined : { y: lifeY }}
                    className="absolute -bottom-6 -left-16 z-10 w-[44%] overflow-hidden rounded-[22px] border-[6px] border-white shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)]"
                  >
                    <StorePhoto
                      file={product.lifestyle}
                      alt={`Using ${product.shortName}`}
                      tone={product.photoTone}
                      sizes="20vw"
                      widths={[320, 480, 640]}
                      className="aspect-[4/5]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                layout
                transition={{ duration: 0.5, ease: EASE }}
                className={`absolute -right-4 top-6 z-10 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md transition-colors duration-700 ${
                  night ? "bg-[#141a3a]/80 text-white ring-1 ring-white/15" : "bg-white/85 text-ink"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Key ingredients</p>
                <ul key={`ing-${i}`} className="mt-1.5 space-y-0.5 text-[13px] font-medium">
                  {product.keyIngredients.slice(0, 4).map((k, n) => (
                    <motion.li
                      key={k}
                      initial={reduce ? false : { opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.35 + n * 0.07, ease: EASE }}
                    >
                      {k}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Progress rail */}
          <div className={`relative z-10 mx-auto w-full max-w-[1300px] px-7 pb-8 pt-6 transition-colors duration-700 ${night ? "text-white" : "text-ink"}`}>
            <div className="grid grid-cols-6 gap-3">
              {STORY.map((s, k) => (
                <button
                  key={`${s.id}-${s.when}-rail`}
                  type="button"
                  onClick={() => jump(k)}
                  className="group text-left"
                  aria-current={k === i ? "step" : undefined}
                >
                  <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70 group-hover:opacity-100">
                    {s.when === "AM" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    {s.title}
                  </span>
                  <span className={`block h-[3px] overflow-hidden rounded-full ${night ? "bg-white/15" : "bg-ink/10"}`}>
                    {k === i ? (
                      <motion.span
                        className={`block h-full origin-left rounded-full ${night ? "bg-accent-yellow" : "bg-ink"}`}
                        style={{ scaleX: local }}
                      />
                    ) : (
                      <motion.span
                        className={`block h-full origin-left rounded-full ${night ? "bg-accent-yellow" : "bg-ink"}`}
                        initial={false}
                        animate={{ scaleX: k < i ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── 3D scene loader: desktop, WebGL and full motion only; otherwise the 2D sky stays ── */

const DayScene3D = lazy(() => import("./DayScene3D"));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function useScene3D() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setEnabled(webgl && wide && !reduce);
  }, []);
  return enabled;
}

function Scene3DSlot({ progress }: { progress: MotionValue<number> }) {
  return (
    <SceneBoundary>
      <Suspense fallback={null}>
        <DayScene3D progress={progress} />
      </Suspense>
    </SceneBoundary>
  );
}

function Chip({ children, night }: { children: React.ReactNode; night: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
        night ? "bg-white/10 text-white ring-1 ring-white/20" : "bg-white text-ink ring-1 ring-ink/10"
      }`}
    >
      {children}
    </span>
  );
}

/** A small sun/moon moving along an arc as the day progresses. */
function SunMoon({ progress, night }: { progress: MotionValue<number>; night: boolean }) {
  const cx = useTransform(progress, (p) => 110 - 92 * Math.cos(Math.PI * p));
  const cy = useTransform(progress, (p) => 96 - 78 * Math.sin(Math.PI * p));
  const shadowX = useTransform(cx, (v) => v + 4);
  const shadowY = useTransform(cy, (v) => v - 3);
  return (
    <svg viewBox="0 0 220 104" className="h-[70px] w-[150px]" aria-hidden="true">
      <path d="M 18 96 A 92 78 0 0 1 202 96" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 5" />
      <line x1="6" y1="96" x2="214" y2="96" stroke="currentColor" strokeOpacity="0.25" />
      <motion.circle cx={cx} cy={cy} r="16" fill={night ? "#E7E9F8" : "#F0C020"} opacity={0.25} />
      <motion.circle cx={cx} cy={cy} r="9" fill={night ? "#E7E9F8" : "#F0C020"} />
      <motion.circle cx={shadowX} cy={shadowY} r="8" fill="#232A52" style={{ opacity: night ? 1 : 0 }} />
    </svg>
  );
}

/* ── A day with Rosaleigh (mobile) ───────────────────────────────────────── */

function DayStoryMobile() {
  return (
    <section className="mt-16 px-4 md:hidden">
      <Reveal>
        <p className="rl-eyebrow">A day with Rosaleigh</p>
        <h2 className="mt-3 text-[2.6rem] leading-[1.02]">
          Five products. Six steps. <em className="italic text-highlight">One simple order.</em>
        </h2>
      </Reveal>
      {(["AM", "PM"] as const).map((when) => (
        <div
          key={when}
          className={`mt-8 rounded-[28px] p-4 ${
            when === "AM" ? "bg-gradient-to-b from-[#FDE7D8] to-[#FEF3E3]" : "bg-gradient-to-b from-[#2E3360] to-[#151A35] text-white"
          }`}
        >
          <p
            className={`flex items-center gap-2 px-1 pt-1 text-xs font-bold uppercase tracking-[0.18em] ${
              when === "AM" ? "text-highlight" : "text-accent-yellow"
            }`}
          >
            {when === "AM" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {when === "AM" ? "Morning" : "Evening"}
          </p>
          <ol className="mt-3 space-y-3">
            {STORY.filter((s) => s.when === when).map((s, n) => {
              const p = PRODUCTS[s.id];
              const g = PRODUCT_GUIDE[s.id];
              return (
                <Reveal as="li" key={`${s.id}-${when}`} delay={n * 80}>
                  <article className={`overflow-hidden rounded-[22px] ${when === "AM" ? "bg-white" : "bg-white/[0.07] ring-1 ring-white/10"}`}>
                    <StorePhoto file={p.photo} alt={p.name} tone={p.photoTone} sizes="100vw" widths={[480, 768]} className="aspect-[16/10]" />
                    <div className="p-4">
                      <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${when === "AM" ? "text-highlight" : "text-accent-yellow"}`}>
                        Step {n + 1} · {s.title}
                      </p>
                      <h3 className={`mt-1 text-[1.7rem] leading-tight ${when === "AM" ? "" : "!text-white"}`}>{p.shortName}</h3>
                      <p className={`mt-1 text-[13px] font-semibold ${when === "AM" ? "text-heading" : "text-white/85"}`}>
                        {g.quantity}
                        {g.wait ? ` · wait ${g.wait}` : ""}
                      </p>
                      <ol className={`mt-3 space-y-1.5 text-[13.5px] leading-relaxed ${when === "AM" ? "text-foreground" : "text-white/75"}`}>
                        {g.steps.map((line, k) => (
                          <li key={line} className="flex gap-2">
                            <span className="font-semibold">{k + 1}.</span>
                            {line}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}

/* ── Personaliser: show how answers change the routine ───────────────────── */

const SKIN_TYPES: { value: string; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "dry", label: "Dry" },
  { value: "oily", label: "Oily" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
];

function Personaliser() {
  const [skinType, setSkinType] = useState("normal");
  const [spf, setSpf] = useState<"daily" | "sometimes">("daily");
  const answers: QuizAnswers = useMemo(
    () => ({
      ...BASE_ANSWERS,
      skinType,
      hydration: skinType === "oily" ? "oily" : skinType === "dry" ? "tight" : "balanced",
      spf,
    }),
    [skinType, spf],
  );
  const base = useMemo(() => analyzeSkin({ answers: BASE_ANSWERS, source: "quiz" }), []);
  const result = useMemo(() => analyzeSkin({ answers, source: "quiz" }), [answers]);
  const baseTip = (when: "AM" | "PM", id: ProductId) =>
    (when === "AM" ? base.am : base.pm).find((s) => s.productId === id)?.tip;

  return (
    <section className="mx-auto mt-24 max-w-[1300px] px-4 md:mt-32 md:px-7">
      <div className="grid gap-10 rounded-[2rem] bg-surface p-6 md:grid-cols-[0.85fr_1.15fr] md:gap-14 md:p-14">
        <Reveal>
          <p className="rl-eyebrow">Made for your skin</p>
          <h2 className="mt-3 text-[2.6rem] leading-[1.02] md:text-[3.4rem]">The same five products. A routine that's yours.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Your answers change the order, the amounts and the advice, using the directions on each
            Rosaleigh product page. Try it: pick a skin type and watch the routine adjust.
          </p>
          <fieldset className="mt-8">
            <legend className="text-xs font-bold uppercase tracking-[0.16em] text-heading">Skin type</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {SKIN_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={skinType === t.value}
                  onClick={() => setSkinType(t.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    skinType === t.value ? "bg-ink text-white" : "bg-white text-heading ring-1 ring-border hover:ring-ink/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="text-xs font-bold uppercase tracking-[0.16em] text-heading">Wear SPF every day?</legend>
            <div className="mt-3 inline-flex rounded-full bg-white p-1 ring-1 ring-border">
              {(["daily", "sometimes"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={spf === v}
                  onClick={() => setSpf(v)}
                  className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors ${spf === v ? "text-ink" : "text-muted-foreground"}`}
                >
                  {spf === v && (
                    <motion.span
                      layoutId="spf-pill"
                      className="absolute inset-0 rounded-full bg-accent-yellow"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{v === "daily" ? "Yes, daily" : "Not always"}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </Reveal>

        <Reveal delay={120} className="grid gap-4 sm:grid-cols-2">
          {(["AM", "PM"] as const).map((when) => {
            const list = when === "AM" ? result.am : result.pm;
            return (
              <div key={when} className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-border sm:p-5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-heading">
                  {when === "AM" ? <Sun className="h-4 w-4 text-[#C2593B]" /> : <Moon className="h-4 w-4 text-[#3D4C99]" />}
                  {when === "AM" ? "Morning" : "Evening"}
                </p>
                <motion.ol layout className="mt-4 space-y-3">
                  <AnimatePresence initial={false} mode="popLayout">
                    {list.map((s, n) => {
                      const changed = s.tip !== baseTip(when, s.productId);
                      return (
                        <motion.li
                          layout
                          key={`${when}-${s.productId}`}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.35, ease: EASE }}
                          className="flex gap-3"
                        >
                          <div className="w-14 shrink-0">
                            <ProductTile id={s.productId} rounded="rounded-xl" sizes="56px" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold leading-snug text-heading">
                              <span className="text-muted-foreground">{n + 1}.</span> {PRODUCTS[s.productId].shortName}
                            </p>
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={s.tip}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                                className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground"
                              >
                                {changed && (
                                  <span className="mr-1 rounded-full bg-accent-yellow px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide text-ink">
                                    Adjusted
                                  </span>
                                )}
                                {s.tip}
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ol>
                {when === "AM" && skinType === "sensitive" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 rounded-xl bg-surface px-3 py-2 text-[12px] leading-snug text-heading"
                  >
                    Sensitive skin: rinse with water in the morning and use the Face Wash once, in the evening.
                  </motion.p>
                )}
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

/* ── What's in each step ─────────────────────────────────────────────────── */

const INGREDIENT_ORDER: ProductId[] = ["cleanser", "face-wash", "day-cream", "night-cream", "strips"];

function Ingredients() {
  const scroller = useRef<HTMLDivElement>(null);
  const by = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" });
  };
  return (
    <section className="mt-24 md:mt-32">
      <div className="mx-auto flex max-w-[1300px] items-end justify-between gap-6 px-4 md:px-7">
        <Reveal>
          <p className="rl-eyebrow">What's inside</p>
          <h2 className="mt-3 text-[2.6rem] leading-[1.02] md:text-6xl">
            Every step, <em className="italic text-highlight">explained.</em>
          </h2>
        </Reveal>
        <div className="hidden gap-2 md:flex">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? "Previous product" : "Next product"}
              onClick={() => by(d)}
              className="flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-border transition-colors hover:bg-ink hover:text-white"
            >
              {d < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={scroller}
        className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] md:gap-5 [&::-webkit-scrollbar]:hidden"
        style={{
          paddingInline: "max(1rem, calc((100vw - 1300px) / 2 + 1.75rem))",
          scrollPaddingInline: "max(1rem, calc((100vw - 1300px) / 2 + 1.75rem))",
        }}
      >
        {INGREDIENT_ORDER.map((id, n) => {
          const p = PRODUCTS[id];
          return (
            <Reveal key={id} delay={n * 80} className="w-[82vw] max-w-[360px] shrink-0 snap-start">
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="group block h-full rounded-[26px] bg-white p-2.5 ring-1 ring-border transition-shadow duration-500 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative overflow-hidden rounded-[20px]">
                  <StorePhoto
                    file={p.photo}
                    alt={p.name}
                    tone={p.photoTone}
                    sizes="360px"
                    widths={[360, 720]}
                    className="aspect-[4/5]"
                    imgClassName="duration-[900ms] group-hover:scale-[1.06]"
                  />
                  <span className="rl-pill absolute left-3 top-3">{p.slot}</span>
                </div>
                <div className="px-3 pb-4 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-highlight">{p.role}</p>
                  <h3 className="mt-1.5 text-[1.75rem] leading-tight">{p.shortName}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{p.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {p.keyIngredients.map((k) => (
                      <li key={k} className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-heading">
                        {k}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink underline decoration-ink/20 underline-offset-[6px] group-hover:decoration-ink">
                    View product <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ── First month ─────────────────────────────────────────────────────────── */

function FirstMonth() {
  const steps = useMemo(() => routineSteps(analyzeSkin({ answers: BASE_ANSWERS, source: "quiz" })), []);
  const total = steps.reduce((n, s) => n + s.minutes, 0);
  return (
    <section className="mx-auto mt-24 max-w-[1300px] px-4 md:mt-32 md:px-7">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <Reveal>
          <p className="rl-eyebrow">Your first 30 days</p>
          <h2 className="mt-3 text-[2.6rem] leading-[1.02] md:text-[3.4rem]">
            About {total} minutes a day. <em className="italic text-highlight">Thirty days to make it yours.</em>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Your plan starts with a patch test, then builds a steady habit: the same steps, in the same
            order, every morning and evening. Here's how long each part takes.
          </p>
          <div className="mt-8 rounded-[24px] bg-white p-5 ring-1 ring-border md:p-6">
            <DailyTimeChart steps={steps} />
          </div>
        </Reveal>
        <Reveal delay={120} className="rounded-[28px] bg-surface p-5 md:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-heading">Your 30-day plan</p>
            <p className="text-right text-xs text-muted-foreground">Download it as a PDF with your results</p>
          </div>
          <div className="mt-5">
            <MonthPlan />
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Days 1–7", "Patch test each new product, then start your routine."],
              ["Days 8–21", "Same order, same amounts, every day."],
              ["Days 22–30", "It's a habit now. Keep going."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white p-4 ring-1 ring-border">
                <p className="font-display text-2xl text-heading">{t}</p>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Start options ───────────────────────────────────────────────────────── */

function StartOptions({ onChoose }: Props) {
  const cards = [
    {
      path: "photo" as const,
      file: BRAND_IMAGES.warm,
      tone: "#D9B48F",
      eyebrow: "Recommended · Your photo stays on your device",
      title: "Scan your skin",
      body: "Take a selfie or upload a photo. We map your face, take four readings and you confirm three details.",
      cta: "Start the scan",
    },
    {
      path: "quiz" as const,
      file: BRAND_IMAGES.sky,
      tone: "#7FA9D6",
      eyebrow: "No photo · 2 minutes",
      title: "Take the skin quiz",
      body: "Six questions about your skin, your habits and what you'd like to improve.",
      cta: "Start the quiz",
    },
  ];
  return (
    <section className="mx-auto mt-24 max-w-[1300px] px-4 md:mt-32 md:px-7">
      <Reveal className="max-w-2xl">
        <p className="rl-eyebrow">Ready when you are</p>
        <h2 className="mt-3 text-[2.6rem] leading-[1.02] md:text-6xl">Two ways to begin.</h2>
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
        {cards.map((c, n) => (
          <Reveal key={c.path} delay={n * 120}>
            <button
              type="button"
              onClick={() => onChoose(c.path)}
              className="group relative isolate block aspect-[4/5] w-full overflow-hidden rounded-[2rem] text-left sm:aspect-[5/4] md:aspect-[4/3.4]"
            >
              <StorePhoto
                file={c.file}
                alt=""
                tone={c.tone}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="absolute inset-0 -z-10"
                imgClassName="duration-[1200ms] group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="flex h-full flex-col justify-end p-7 text-white md:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-yellow">{c.eyebrow}</p>
                <h3 className="mt-2 text-[2.6rem] leading-none !text-white md:text-5xl">{c.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">{c.body}</p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white py-3 pl-6 pr-4 text-sm font-semibold text-ink transition-colors duration-300 group-hover:bg-accent-yellow">
                  {c.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────────── */

const FAQ = [
  {
    q: "Which products are in the routine?",
    a: "Five Rosaleigh products: Turmeric Face Wash, Radiance+ Sublingual Strips and Radiance+ SPF50 Day Cream in the morning; Cleansing Tallow Balm, Turmeric Face Wash and Radiance+ Night Cream in the evening.",
  },
  {
    q: "What do my answers change?",
    a: "The order, the advice and some steps, whether you take the quiz or the scan. For example, sensitive skin uses the Face Wash once a day in the evening, combination skin starts with a smaller amount of Night Cream, and oily skin focuses cleansing on the T-zone.",
  },
  {
    q: "Is this a medical diagnosis?",
    a: "No. The Routine Finder gives general skincare guidance based on your answers. If you have a diagnosed skin condition, please speak to a dermatologist before starting a new routine.",
  },
  {
    q: "How does the skin scan work?",
    a: "Google's MediaPipe face model maps 478 points on your face, right in your browser. We then measure small areas of skin in your photo: shine across the T-zone, redness on the cheeks, how even the tone is and how smooth the surface looks. Lighting and make-up affect these readings, so you confirm three details before we build your routine. It's guidance, not a diagnosis.",
  },
  {
    q: "What happens to my photo?",
    a: "Your photo is processed on your own device and is never uploaded or stored by us. Close the page and it's gone.",
  },
  {
    q: "Are the Radiance+ Sublingual Strips suitable for everyone?",
    a: "They are a food supplement for adults. Take no more than one strip a day. If you are pregnant, breastfeeding or taking medication, speak to your doctor before use.",
  },
  {
    q: "Can I keep my routine?",
    a: "Yes. Your routine is remembered on this device (your photo is not), and you can download your full routine and 30-day plan as a PDF.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto mt-24 grid max-w-[1300px] gap-10 px-4 md:mt-32 md:grid-cols-[0.75fr_1.25fr] md:px-7">
      <Reveal>
        <p className="rl-eyebrow">Questions</p>
        <h2 className="mt-3 text-[2.6rem] leading-[1.02] md:text-6xl">Good to know.</h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Still unsure about something? The Rosaleigh team is happy to help through the Contact page.
        </p>
      </Reveal>
      <Reveal delay={100}>
        <ul className="border-t border-border">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="border-b border-border">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left text-[17px] font-semibold text-heading"
                >
                  {item.q}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isOpen ? "bg-accent-yellow text-ink" : "bg-surface"}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-muted-foreground">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
