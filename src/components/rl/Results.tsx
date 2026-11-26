import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  Check,
  Clock,
  Download,
  FlaskConical,
  Lightbulb,
  Moon,
  RotateCcw,
  Scan,
  ShoppingBag,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import { BUNDLES, PRODUCTS, type ProductId } from "@/data/catalogue";
import { metricsFor, type SkinResult } from "@/lib/analysis";
import { buildPlan, routineSteps, type PlanStep } from "@/lib/plan";
import { downloadRoutinePdf } from "@/lib/pdf";
import { describeReadings } from "@/lib/skin-scan";
import { ProductTile, Reveal } from "./Brand";
import { DailyTimeChart, DayDial, MetricRing, MonthPlan, ScoreRing } from "./Viz";
import { DISCLAIMER } from "./Chrome";
import { ResultsScience } from "./ResultsScience";
import { ScanOverlay, type ScanPhoto } from "./SkinScan";

interface Props {
  result: SkinResult;
  returning: boolean;
  onRestart: () => void;
  /** Open the step picker to change the routine */
  onEditSteps: () => void;
  /** The photo scanned this visit, if any. Memory only, so a returning visitor has none. */
  photo?: ScanPhoto | null;
}

type Tab = "skin" | "routine" | "science" | "shop";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "routine", label: "Your routine", icon: <CalendarRange className="h-4 w-4" /> },
  { id: "skin", label: "Your skin", icon: <Scan className="h-4 w-4" /> },
  { id: "science", label: "Science", icon: <FlaskConical className="h-4 w-4" /> },
  { id: "shop", label: "Shop", icon: <ShoppingBag className="h-4 w-4" /> },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function Results({ result, returning, onRestart, onEditSteps, photo }: Props) {
  const reduce = useReducedMotion();
  const metrics = metricsFor(result);
  const steps = useMemo(() => routineSteps(result), [result]);
  const phases = useMemo(() => buildPlan(result), [result]);
  const am = steps.filter((s) => s.when === "AM");
  const pm = steps.filter((s) => s.when === "PM");
  const minutes = steps.reduce((n, s) => n + s.minutes, 0);
  const uniqueIds = [...new Set(steps.map((s) => s.productId))] as ProductId[];

  const [tab, setTab] = useState<Tab>("routine");
  const [downloading, setDownloading] = useState(false);
  const tabAnchorRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadRoutinePdf(
        result,
        photo
          ? {
              url: photo.url,
              ...(photo.scan ? { focus: { x: photo.scan.landmarks[1]!.x, y: photo.scan.landmarks[1]!.y } } : {}),
            }
          : null,
      );
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const anchor = tabAnchorRef.current;
    if (!anchor) return;
    const top = anchor.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  }, [tab]);

  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-6 md:px-7 md:pt-8">
      {/* ── Summary header ── */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative overflow-hidden rounded-[2rem] px-6 py-8 md:px-12 md:py-12"
        style={{
          background:
            "radial-gradient(70% 120% at 100% 0%, #D9DDF5 0%, rgba(217,221,245,0) 60%), radial-gradient(70% 120% at 0% 100%, #FBE3D6 0%, rgba(251,227,214,0) 55%), #F7F1EE",
        }}
      >
        <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            {returning && (
              <p className="mb-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-heading">
                Welcome back. Here's the routine we built for you.
              </p>
            )}
            <p className="rl-eyebrow">Your Rosaleigh routine</p>
            <h1 className="mt-3 text-[2.9rem] leading-[1] md:text-[4.2rem]">
              {result.custom ? (
                <>
                  Your own routine, <em className="italic text-highlight">in order.</em>
                </>
              ) : (
                <>
                  Your routine is <em className="italic text-highlight">ready.</em>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {am.length} {am.length === 1 ? "step" : "steps"} each morning, {pm.length} each evening, about {minutes} minutes a day.
              Built for {metrics.skinType.toLowerCase()} skin with a focus on {metrics.concern.toLowerCase()}.
            </p>
            <button
              type="button"
              onClick={onEditSteps}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-[13px] font-semibold text-heading ring-1 ring-border transition-colors hover:bg-ink hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> {result.custom ? "Change my steps" : "Build my own instead"}
            </button>
            <dl className="mt-6 grid max-w-md grid-cols-3 gap-2">
              {[
                ["Skin type", metrics.skinType],
                ["Focus", metrics.concern],
                ["Each day", `~${minutes} min`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white/80 px-3 py-3 backdrop-blur">
                  <dt className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
                  <dd className="mt-1 text-[13.5px] font-semibold leading-tight text-heading">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {photo ? (
            <YourScanCard photo={photo} ids={uniqueIds} />
          ) : (
          /* fanned product photography */
          <div className="relative mx-auto h-[230px] w-full max-w-[420px] md:h-[300px]">
            {uniqueIds.map((id, n) => {
              const mid = (uniqueIds.length - 1) / 2;
              const off = n - mid;
              return (
                <motion.div
                  key={id}
                  initial={reduce ? false : { opacity: 0, y: 40, rotate: 0 }}
                  animate={{ opacity: 1, y: Math.abs(off) * 10, rotate: off * 6 }}
                  transition={{ duration: 0.9, delay: 0.25 + n * 0.08, ease: EASE }}
                  className="absolute top-2 w-[38%] overflow-hidden rounded-[20px] border-4 border-white shadow-[0_24px_48px_-24px_rgba(35,31,32,0.45)]"
                  style={{ left: `${31 + off * 15}%`, zIndex: 10 - Math.round(Math.abs(off) * 2) }}
                >
                  <ProductTile id={id} rounded="rounded-[14px]" sizes="160px" />
                </motion.div>
              );
            })}
          </div>
          )}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div ref={tabAnchorRef} aria-hidden="true" />
      <div className="sticky top-0 z-20 -mx-4 mt-6 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:-mx-7 md:px-7">
        <div className="relative mx-auto flex max-w-3xl gap-1 rounded-full bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[12px] font-semibold transition-colors sm:text-[13px] ${
                tab === t.id ? "text-ink" : "text-muted-foreground hover:text-heading"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="results-tab"
                  className="absolute inset-0 rounded-full bg-accent-yellow shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative hidden sm:inline">{t.icon}</span>
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="pt-8"
        >
          {tab === "routine" && (
            <RoutineTab
              am={am}
              pm={pm}
              steps={steps}
              phases={phases.map((p) => ({ title: p.title, subtitle: p.subtitle, note: p.note }))}
              onDownload={download}
              downloading={downloading}
              summary={result.summary}
            />
          )}
          {tab === "skin" && <SkinTab result={result} photo={photo} />}
          {tab === "science" && <ResultsScience ids={uniqueIds} />}
          {tab === "shop" && <ShopTab ids={uniqueIds} bundleId={result.bundleId} />}
        </motion.div>
      </AnimatePresence>

      <div className="mx-auto mt-14 max-w-3xl border-t border-border pt-6">
        <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-link underline underline-offset-4"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Start again
        </button>
      </div>
    </section>
  );
}

/* ── Routine tab ─────────────────────────────────────────────────────────── */

function RoutineTab({
  am,
  pm,
  steps,
  phases,
  onDownload,
  downloading,
  summary,
}: {
  am: PlanStep[];
  pm: PlanStep[];
  steps: PlanStep[];
  phases: { title: string; subtitle: string; note: string }[];
  onDownload: () => void;
  downloading: boolean;
  summary: string[];
}) {
  return (
    <div className="space-y-16">
      {/* At a glance */}
      <div className="grid items-center gap-8 rounded-[28px] bg-surface p-6 md:grid-cols-[auto_1fr] md:gap-12 md:p-10">
        <div className="mx-auto">
          <DayDial steps={steps} size={280} />
        </div>
        <div>
          <p className="rl-eyebrow">Your day at a glance</p>
          <h2 className="mt-3 text-4xl leading-[1.05] md:text-5xl">Morning and evening, about twelve hours apart.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Do your morning routine before you start the day and your evening routine before bed. The
            numbers on the dial match the steps below.
          </p>
          <ul className="mt-5 space-y-2">
            {summary.map((line) => (
              <li key={line} className="flex gap-2.5 text-[14px] leading-relaxed text-foreground">
                <Check className="mt-1 h-4 w-4 shrink-0 text-[#2F6B45]" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <RoutineList when="AM" steps={am} />
      <RoutineList when="PM" steps={pm} />

      {/* Time + month */}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="rounded-[28px] bg-white p-6 ring-1 ring-border md:p-8">
          <p className="rl-eyebrow">Time each day</p>
          <h3 className="mt-2 text-3xl leading-tight">How long each routine takes.</h3>
          <div className="mt-6">
            <DailyTimeChart steps={steps} />
          </div>
        </Reveal>
        <Reveal delay={100} className="rounded-[28px] bg-surface p-6 md:p-8">
          <p className="rl-eyebrow">Your first 30 days</p>
          <h3 className="mt-2 text-3xl leading-tight">Patch test, then build the habit.</h3>
          <div className="mt-6">
            <MonthPlan />
          </div>
          <ol className="mt-6 space-y-3">
            {phases.map((p) => (
              <li key={p.title} className="rounded-2xl bg-white p-4 ring-1 ring-border">
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-2xl text-heading">{p.title}</span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-highlight">{p.subtitle}</span>
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{p.note}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-[28px] bg-ink px-6 py-10 text-center text-white md:py-12">
        <p className="rl-eyebrow !text-accent-yellow">Keep it with you</p>
        <h3 className="text-4xl !text-white md:text-5xl">Download your routine.</h3>
        <p className="max-w-md text-sm text-white/70">Every step, amount and tip, plus your 30-day plan and links to each product, in one PDF.</p>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent-yellow px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-white disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>
    </div>
  );
}

function RoutineList({ when, steps }: { when: "AM" | "PM"; steps: PlanStep[] }) {
  const am = when === "AM";
  if (steps.length === 0) {
    return (
      <section className="rounded-[24px] bg-surface p-6 text-[14px] text-muted-foreground">
        {am ? "No morning steps in your routine." : "No evening steps in your routine."}
      </section>
    );
  }
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] ${am ? "text-[#C2593B]" : "text-[#3D4C99]"}`}>
            {am ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {am ? "Morning routine" : "Evening routine"}
          </p>
          <h2 className="mt-2 text-4xl leading-[1.05] md:text-5xl">
            {am ? "Start the day protected." : "End the day clean and cared for."}
          </h2>
        </div>
        <p className="hidden pb-1 text-sm text-muted-foreground md:block">
          {steps.length} {steps.length === 1 ? "step" : "steps"} · ~{steps.reduce((n, s) => n + s.minutes, 0)} min
        </p>
      </div>
      <ol className="mt-6 space-y-4">
        {steps.map((s, n) => (
          <Reveal as="li" key={`${when}-${s.productId}`} delay={n * 90}>
            <StepCard step={s} index={n} tone={am ? "am" : "pm"} />
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function StepCard({ step, index, tone }: { step: PlanStep; index: number; tone: "am" | "pm" }) {
  const product = PRODUCTS[step.productId];
  return (
    <article className="group grid gap-5 rounded-[26px] bg-white p-3 ring-1 ring-border transition-shadow duration-500 hover:shadow-[var(--shadow-soft)] sm:grid-cols-[200px_1fr] sm:p-4 md:grid-cols-[240px_1fr]">
      <div className="relative">
        <ProductTile id={step.productId} rounded="rounded-[20px]" sizes="240px" />
        <span
          className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full font-display text-xl text-white ${
            tone === "am" ? "bg-[#C2593B]" : "bg-[#3D4C99]"
          }`}
        >
          {index + 1}
        </span>
      </div>
      <div className="px-1 pb-2 sm:py-2 sm:pr-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-highlight">{product.role}</p>
            <h3 className="mt-1 text-[1.9rem] leading-tight">{product.shortName}</h3>
          </div>
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-heading transition-colors hover:bg-ink hover:text-white"
          >
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{step.reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-white">{step.quantity}</span>
          <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-semibold text-heading">{step.frequency}</span>
          {step.wait && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF0CF] px-3 py-1 text-[12px] font-semibold text-[#8A6410]">
              <Clock className="h-3.5 w-3.5" /> Wait {step.wait}
            </span>
          )}
        </div>
        <ol className="mt-4 grid gap-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
          {step.steps.map((line, k) => (
            <li key={line} className="flex gap-2.5">
              <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-heading">
                {k + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>
        {step.tip && (
          <p className="mt-4 flex gap-2 rounded-2xl bg-[#FBF0CF]/70 px-3.5 py-2.5 text-[13px] leading-snug text-heading">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6410]" />
            <span>
              <strong className="font-semibold">For your skin: </strong>
              {step.tip}
            </span>
          </p>
        )}
        {step.productId === "strips" && (
          <p className="mt-3 flex gap-2 text-[12px] leading-snug text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {step.caution}
          </p>
        )}
      </div>
    </article>
  );
}

/* ── Skin tab ────────────────────────────────────────────────────────────── */

/* ── The user's own scan in the summary header ─────────────────────────── */

function YourScanCard({ photo, ids }: { photo: ScanPhoto; ids: ProductId[] }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-[360px] pb-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        className="overflow-hidden rounded-[26px] border-[6px] border-white bg-[#141016] shadow-[0_30px_60px_-30px_rgba(35,31,32,0.55)]"
      >
        <div className="flex justify-center [&_svg]:max-h-[360px]">
          <ScanOverlay imageUrl={photo.url} w={photo.w} h={photo.h} phase="confirm" scan={photo.scan} shown={4} />
        </div>
      </motion.div>
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-heading">
        Your scan
      </span>
      <div className="absolute -bottom-1 right-0 flex -space-x-4">
        {ids.slice(0, 4).map((id, n) => (
          <motion.div
            key={id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + n * 0.08, ease: EASE }}
            className="w-16 overflow-hidden rounded-[14px] border-[3px] border-white shadow-lg md:w-20"
          >
            <ProductTile id={id} rounded="rounded-[10px]" sizes="80px" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SkinTab({ result, photo }: { result: SkinResult; photo?: ScanPhoto | null }) {
  const metrics = metricsFor(result);
  const a = result.answers;
  const raw = {
    Hydration: a.hydration === "balanced" ? 78 : a.hydration === "oily" ? 60 : 42,
    Firmness: a.concern === "firmness" ? 38 : a.concern === "lines" ? 52 : 72,
    Clarity: a.concern === "dullness" || a.concern === "texture" ? 48 : 74,
    Protection: a.spf === "daily" ? 88 : a.spf === "sometimes" ? 58 : 32,
    Routine: a.routine === "full" ? 82 : a.routine === "basic" ? 62 : 42,
  };
  const axes = (Object.keys(raw) as (keyof typeof raw)[]).filter((k) => !(k === "Routine" && a.routine === "unspecified"));
  const readings = result.readings ? describeReadings(result.readings) : null;
  return (
    <div className="space-y-6">
      <div className="grid items-center gap-8 rounded-[28px] bg-surface p-6 sm:grid-cols-[auto_1fr] sm:gap-12 sm:p-10">
        <div className="mx-auto rounded-full bg-white p-3 shadow-[0_20px_40px_-24px_rgba(35,31,32,0.4)]">
          <ScoreRing value={metrics.score} size={200} />
        </div>
        <div>
          <p className="rl-eyebrow">Skin profile score</p>
          <p className="mt-2 font-display text-5xl leading-none text-heading">{metrics.band}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {readings
              ? "A guide score from your skin type, main concern and sun protection, which you confirmed after your scan."
              : "A guide score from your answers about hydration, sun protection, your main concern and your current routine."}{" "}
            It's not a medical measurement; it simply shows where your routine can help most.
          </p>
        </div>
      </div>
      {readings && (
        <div className="rounded-[28px] bg-ink p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="rl-eyebrow !text-accent-yellow">From your skin scan</p>
              <h3 className="mt-2 text-3xl leading-tight !text-white">What your photo showed.</h3>
            </div>
            <p className="text-xs text-white/60">Measured on your device · not a diagnosis</p>
          </div>
          <div className={`mt-6 grid gap-5 ${photo ? "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" : ""}`}>
          {photo && (
            <div className="flex justify-center self-start overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/10 [&_svg]:max-h-[440px]">
              <ScanOverlay imageUrl={photo.url} w={photo.w} h={photo.h} phase="confirm" scan={photo.scan} shown={4} />
            </div>
          )}
          <div className="grid content-start gap-3 sm:grid-cols-2">
            {readings.map((r, i) => (
              <div key={r.key} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{r.label} <span className="font-normal text-white/55">· {r.zone}</span></p>
                  <p className="font-display text-2xl text-accent-yellow">{r.verdict}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-honey to-accent-yellow"
                    initial={{ width: 0 }} animate={{ width: `${r.value}%` }} transition={{ duration: 1, delay: i * 0.12, ease: EASE }} />
                </div>
                <p className="mt-2 text-[12.5px] leading-snug text-white/65">{r.note}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}
      <div className="rounded-[28px] bg-white p-6 ring-1 ring-border sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="rl-eyebrow">{axes.length === 5 ? "Five areas" : "Four areas"}</p>
            <h3 className="mt-2 text-3xl leading-tight">Where your routine will focus.</h3>
          </div>
          <p className="text-xs text-muted-foreground">From your answers · out of 100</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {axes.map((k, i) => (
            <MetricRing key={k} label={k} value={raw[k]} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Shop tab ────────────────────────────────────────────────────────────── */

function ShopTab({ ids, bundleId }: { ids: ProductId[]; bundleId: SkinResult["bundleId"] }) {
  const bundle = BUNDLES[bundleId];
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="rl-eyebrow">Shop your routine</p>
        <h2 className="mt-3 text-4xl leading-[1.05] md:text-5xl">Everything in your routine.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Each product opens on rosaleigh.co.uk, where you'll see today's price and availability.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {ids.map((id, n) => {
          const p = PRODUCTS[id];
          return (
            <Reveal key={id} delay={n * 70}>
              <a href={p.url} target="_blank" rel="noreferrer" className="group block rounded-[22px] bg-white p-2 ring-1 ring-border transition-shadow hover:shadow-[var(--shadow-soft)]">
                <ProductTile id={id} rounded="rounded-[16px]" label={p.slot} />
                <p className="px-2 pb-2 pt-3 text-[13.5px] font-semibold leading-snug text-heading">{p.shortName}</p>
                <span className="mx-2 mb-2 inline-flex items-center gap-1 text-xs font-semibold text-link">
                  View product <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </Reveal>
          );
        })}
      </div>
      <a
        href={bundle.trioUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex flex-col items-start justify-between gap-5 rounded-[26px] bg-ink p-6 text-white md:flex-row md:items-center md:p-8"
      >
        <div className="flex items-center gap-4">
          <div className="flex -space-x-4">
            {(["day-cream", "strips", "night-cream"] as ProductId[]).map((id) => (
              <div key={id} className="w-16 overflow-hidden rounded-2xl border-2 border-ink">
                <ProductTile id={id} rounded="rounded-[14px]" sizes="64px" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-yellow">Rosaleigh bundle</p>
            <p className="mt-1 font-display text-3xl leading-tight">The Inside-Out Trio</p>
            <p className="text-sm text-white/70">Radiance+ Day Cream, Night Cream and Sublingual Strips together.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-yellow px-6 py-3 text-sm font-semibold text-ink transition-colors group-hover:bg-white">
          View the Trio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </a>
    </div>
  );
}
