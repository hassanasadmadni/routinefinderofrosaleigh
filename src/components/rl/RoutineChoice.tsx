// After the analysis: take the recommended routine, or pick your own steps.
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ArrowRight, Check, Moon, RotateCcw, SlidersHorizontal, Sparkles, Sun } from "lucide-react";
import { PRODUCTS, type ProductId } from "@/data/catalogue";
import { PRODUCT_GUIDE } from "@/data/routine-guide";
import { ROUTINE_ORDER, metricsFor, type SkinResult } from "@/lib/analysis";
import { ProductTile } from "./Brand";
import { ScanOverlay, type ScanPhoto } from "./SkinScan";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEP_NAME: Record<"am" | "pm", Partial<Record<ProductId, string>>> = {
  am: { "face-wash": "Wake-up cleanse", strips: "Inside-out", "day-cream": "Protect" },
  pm: { cleanser: "First cleanse", "face-wash": "Second cleanse", "night-cream": "Overnight" },
};

type Picks = { am: ProductId[]; pm: ProductId[] };

interface Props {
  /** The recommended routine, built from the scan or quiz */
  recommended: SkinResult;
  photo?: ScanPhoto | null;
  /** Start straight in the step picker (e.g. "Change my steps" from the results) */
  startInBuilder?: boolean;
  /** Steps to pre-select in the picker; defaults to the recommendation */
  initialPicks?: Picks;
  onRecommended: () => void;
  onCustom: (picks: Picks) => void;
}

export function RoutineChoice({ recommended, photo, startInBuilder = false, initialPicks, onRecommended, onCustom }: Props) {
  const [mode, setMode] = useState<"choose" | "build">(startInBuilder ? "build" : "choose");
  return (
    <AnimatePresence mode="wait">
      {mode === "choose" ? (
        <Choose key="choose" recommended={recommended} photo={photo} onRecommended={onRecommended} onBuild={() => setMode("build")} />
      ) : (
        <Builder
          key="build"
          recommended={recommended}
          initialPicks={initialPicks}
          onBack={() => setMode("choose")}
          onDone={onCustom}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Two ways forward ───────────────────────────────────────────────────── */

function Choose({
  recommended,
  photo,
  onRecommended,
  onBuild,
}: {
  recommended: SkinResult;
  photo?: ScanPhoto | null;
  onRecommended: () => void;
  onBuild: () => void;
}) {
  const reduce = useReducedMotion();
  const m = metricsFor(recommended);
  const ids = [...recommended.am, ...recommended.pm].map((s) => s.productId);
  const unique = [...new Set(ids)];
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto max-w-[1200px] px-4 pt-8 md:px-7 md:pt-12"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="rl-eyebrow">Your analysis is ready</p>
        <h1 className="mt-3 text-[2.8rem] leading-[1.02] md:text-6xl">
          How would you like <em className="italic text-highlight">your routine?</em>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {m.skinType} skin, focusing on {m.concern.toLowerCase()}. Take the routine we built for you, or choose your own
          steps and we'll keep them in the right order.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {/* Recommended */}
        <motion.button
          type="button"
          onClick={onRecommended}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="group relative flex flex-col overflow-hidden rounded-[30px] bg-ink text-left text-white shadow-[0_40px_80px_-40px_rgba(35,31,32,0.7)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-yellow"
        >
          <div className="relative h-[240px] overflow-hidden md:h-[280px]">
            {photo ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#141016] [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-none">
                <ScanOverlay imageUrl={photo.url} w={photo.w} h={photo.h} phase="confirm" scan={photo.scan} shown={4} />
              </div>
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: "radial-gradient(80% 100% at 80% 0%, #6274BD 0%, rgba(98,116,189,0) 60%), radial-gradient(70% 90% at 0% 100%, #EB9F86 0%, rgba(235,159,134,0) 60%), #231F20" }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
            <div className="absolute bottom-5 left-6 flex -space-x-3">
              {unique.map((id, n) => (
                <motion.div
                  key={id}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 + n * 0.07, ease: EASE }}
                  className="w-14 overflow-hidden rounded-[14px] border-[3px] border-ink transition-transform duration-500 group-hover:-translate-y-1 md:w-16"
                  style={{ transitionDelay: `${n * 40}ms` }}
                >
                  <ProductTile id={id} rounded="rounded-[10px]" sizes="64px" />
                </motion.div>
              ))}
            </div>
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-accent-yellow px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
              <Sparkles className="h-3.5 w-3.5" /> Recommended
            </span>
          </div>
          <div className="flex flex-1 flex-col p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-yellow">
              Built from your {recommended.source === "photo" ? "scan" : "answers"}
            </p>
            <h2 className="mt-2 text-[2.2rem] leading-tight !text-white">Get my recommended routine</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/70">
              {recommended.am.length} morning steps and {recommended.pm.length} evening steps, with tips for{" "}
              {m.skinType.toLowerCase()} skin and a 30-day plan.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-accent-yellow px-6 py-3.5 text-[14px] font-semibold text-ink">
              See my routine <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </motion.button>

        {/* Build your own */}
        <motion.button
          type="button"
          onClick={onBuild}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="group relative flex flex-col overflow-hidden rounded-[30px] bg-white text-left ring-1 ring-border transition-shadow hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-yellow"
        >
          <div className="relative h-[240px] overflow-hidden bg-surface md:h-[280px]">
            <div className="absolute inset-0 grid grid-cols-3 gap-2 p-5">
              {(["am", "pm"] as const).flatMap((w) =>
                ROUTINE_ORDER[w].map((id, n) => (
                  <motion.div
                    key={`${w}-${id}`}
                    initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + (w === "am" ? n : n + 3) * 0.06, ease: EASE }}
                    className="relative overflow-hidden rounded-[16px] bg-white ring-1 ring-border transition-transform duration-500 group-hover:rotate-[-1.5deg] even:group-hover:rotate-[1.5deg]"
                  >
                    <ProductTile id={id} rounded="rounded-none" sizes="120px" />
                    <span
                      className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full ${
                        n % 2 === 0 || w === "pm" ? "bg-ink text-white" : "bg-white text-transparent ring-1 ring-border"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </motion.div>
                )),
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col p-6 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-highlight">Your choice</p>
            <h2 className="mt-2 text-[2.2rem] leading-tight">Build my own routine</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              Pick the steps you want from the six. We'll put them in the right order and let you know if something
              important is missing.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 self-start rounded-full px-6 py-3.5 text-[14px] font-semibold text-ink ring-1 ring-ink">
              <SlidersHorizontal className="h-4 w-4" /> Choose my steps
            </span>
          </div>
        </motion.button>
      </div>
    </motion.section>
  );
}

/* ── Step picker ────────────────────────────────────────────────────────── */

function Builder({
  recommended,
  initialPicks,
  onBack,
  onDone,
}: {
  recommended: SkinResult;
  initialPicks?: Picks;
  onBack: () => void;
  onDone: (picks: Picks) => void;
}) {
  const reduce = useReducedMotion();
  const rec: Picks = useMemo(
    () => ({ am: recommended.am.map((s) => s.productId), pm: recommended.pm.map((s) => s.productId) }),
    [recommended],
  );
  const [picks, setPicks] = useState<Picks>(initialPicks ?? rec);
  const toggle = (w: "am" | "pm", id: ProductId) =>
    setPicks((p) => ({ ...p, [w]: p[w].includes(id) ? p[w].filter((x) => x !== id) : [...p[w], id] }));

  const has = (w: "am" | "pm", id: ProductId) => picks[w].includes(id);
  const total = picks.am.length + picks.pm.length;
  const minutes = (["am", "pm"] as const).reduce(
    (n, w) => n + picks[w].reduce((m, id) => m + PRODUCT_GUIDE[id].minutes, 0),
    0,
  );

  const notes: string[] = [];
  if (!has("am", "day-cream"))
    notes.push("No SPF in the morning. Daily sun protection is the step we'd most encourage, whatever else you choose.");
  if (has("pm", "night-cream") && !has("pm", "cleanser") && !has("pm", "face-wash"))
    notes.push("Night Cream works best on clean skin. Consider keeping at least one evening cleanse.");
  if (has("am", "day-cream") && !has("pm", "cleanser"))
    notes.push("SPF is made to stay put. The Cleansing Balm is the easiest way to remove it fully in the evening.");
  if (has("am", "face-wash") && recommended.answers.skinType === "sensitive")
    notes.push("For sensitive skin, Rosaleigh suggests one face wash a day, in the evening. A water rinse is enough in the morning.");

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto max-w-[1200px] px-4 pt-8 md:px-7 md:pt-10"
    >
      <button type="button" onClick={onBack} className="text-sm font-semibold text-muted-foreground hover:text-ink">
        ← Back
      </button>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rl-eyebrow">Build your own</p>
          <h1 className="mt-2 text-[2.6rem] leading-[1.02] md:text-6xl">
            Choose your <em className="italic text-highlight">steps.</em>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setPicks(rec)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to recommended
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {(["am", "pm"] as const).map((w) => (
          <div key={w} className={`rounded-[28px] p-5 md:p-6 ${w === "am" ? "bg-[#FBEFE6]" : "bg-[#1E244F] text-white"}`}>
            <p className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] ${w === "am" ? "text-highlight" : "text-accent-yellow"}`}>
              {w === "am" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {w === "am" ? "Morning" : "Evening"}
            </p>
            <ol className="mt-4 space-y-3">
              {ROUTINE_ORDER[w].map((id, n) => {
                const on = has(w, id);
                const isRec = rec[w].includes(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(w, id)}
                      className={`flex w-full items-center gap-4 rounded-[20px] p-3 text-left transition-all duration-300 ${
                        on
                          ? w === "am"
                            ? "bg-white shadow-[0_16px_30px_-20px_rgba(35,31,32,0.45)]"
                            : "bg-white/12 ring-1 ring-white/25"
                          : "opacity-60 hover:opacity-90"
                      }`}
                    >
                      <span className="relative w-16 shrink-0 md:w-20">
                        <ProductTile id={id} rounded="rounded-[14px]" sizes="80px" />
                        <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white ring-2 ring-white">
                          {n + 1}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[10.5px] font-bold uppercase tracking-[0.14em] ${w === "am" ? "text-muted-foreground" : "text-white/55"}`}>
                          {STEP_NAME[w][id]}
                        </span>
                        <span className="mt-0.5 block font-display text-[1.45rem] leading-tight">{PRODUCTS[id].shortName}</span>
                        {isRec && (
                          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${w === "am" ? "bg-accent-yellow/30 text-ink" : "bg-accent-yellow text-ink"}`}>
                            <Sparkles className="h-3 w-3" /> Recommended for you
                          </span>
                        )}
                      </span>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                          on ? "bg-accent-yellow text-ink" : w === "am" ? "ring-1 ring-border" : "ring-1 ring-white/30"
                        }`}
                      >
                        {on && <Check className="h-4 w-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {notes.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-2 overflow-hidden"
          >
            {notes.map((n) => (
              <li key={n} className="flex gap-2.5 rounded-2xl bg-surface px-4 py-3 text-[13.5px] leading-snug text-heading">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-highlight" /> {n}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <div className="sticky bottom-4 z-10 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-full bg-ink py-3 pl-6 pr-3 text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
        <p className="text-[14px]">
          <span className="font-semibold">{total} {total === 1 ? "step" : "steps"}</span>
          <span className="text-white/60"> · about {minutes} min a day</span>
        </p>
        <button
          type="button"
          disabled={total === 0}
          onClick={() => onDone(picks)}
          className="inline-flex items-center gap-2 rounded-full bg-accent-yellow px-6 py-3 text-[14px] font-semibold text-ink disabled:opacity-40"
        >
          Build my routine <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.section>
  );
}
