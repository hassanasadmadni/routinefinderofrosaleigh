import { useEffect, useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CountUp, StorePhoto } from "./Brand";
import { PRODUCTS, BRAND_IMAGES, type ProductId } from "@/data/catalogue";

/* ────────────────────────────────────────────────────────────────────────────
   Shared helpers
──────────────────────────────────────────────────────────────────────────── */

/** True once the element has scrolled into view (fires once). */
function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const delay = (ms: number) => ({ "--rl-delay": `${ms}ms` }) as React.CSSProperties;

export type MetricTone = "strong" | "fair" | "focus";

export function toneFor(value: number): MetricTone {
  return value >= 70 ? "strong" : value >= 50 ? "fair" : "focus";
}

const TONE: Record<MetricTone, { from: string; to: string; label: string; chip: string }> = {
  strong: { from: "#7FB394", to: "#2F6B45", label: "Strong", chip: "bg-[#E3F0E7] text-[#2F6B45]" },
  fair: { from: "#F0C020", to: "#D1A875", label: "Fair", chip: "bg-[#FBF0CF] text-[#8A6410]" },
  focus: { from: "#EB9F86", to: "#983C2F", label: "Focus area", chip: "bg-[#F8E2DB] text-[#983C2F]" },
};

/* ────────────────────────────────────────────────────────────────────────────
   Score ring (main skin score)
──────────────────────────────────────────────────────────────────────────── */

export function ScoreRing({ value, size = 200, label }: { value: number; size?: number; label?: string }) {
  const id = useId().replace(/:/g, "");
  const { ref, inView } = useInView<SVGSVGElement>(0.3);
  const r = 84;
  const c = 2 * Math.PI * r;
  const tone = TONE[toneFor(value)];
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={`Skin score ${value} out of 100`}>
      <defs>
        <linearGradient id={`sr-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone.from} />
          <stop offset="100%" stopColor={tone.to} />
        </linearGradient>
      </defs>
      {/* ticks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const r1 = 97;
        const r2 = i % 5 === 0 ? 92 : 94.5;
        return (
          <line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)} x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)}
            stroke="#E6E1DE" strokeWidth={i % 5 === 0 ? 1.4 : 0.8} />
        );
      })}
      <circle cx="100" cy="100" r={r} fill="none" stroke="#F3ECE7" strokeWidth="12" />
      <circle cx="100" cy="100" r={r} fill="none" stroke={`url(#sr-${id})`} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={inView ? c * (1 - value / 100) : c} transform="rotate(-90 100 100)" className="rl-ring" />
      <text x="100" y="104" textAnchor="middle" fontSize="64" fill="#231F20" fontFamily="'Instrument Serif', Georgia, serif">
        {inView ? <CountUp value={value} duration={1400} /> : 0}
      </text>
      <text x="100" y="128" textAnchor="middle" fontSize="10" letterSpacing="2" fill="#6E6869" fontFamily="Figtree, sans-serif" fontWeight={600}>
        {label ?? "OUT OF 100"}
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Metric ring (one skin dimension)
──────────────────────────────────────────────────────────────────────────── */

export function MetricRing({ label, value, index = 0 }: { label: string; value: number; index?: number }) {
  const id = useId().replace(/:/g, "");
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const r = 34;
  const c = 2 * Math.PI * r;
  const t = toneFor(value);
  const tone = TONE[t];
  return (
    <div ref={ref} className="flex flex-col items-center rounded-[20px] bg-white px-2 pb-4 pt-5 text-center shadow-[var(--shadow-card)] ring-1 ring-border">
      <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
        <defs>
          <linearGradient id={`mr-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tone.from} />
            <stop offset="100%" stopColor={tone.to} />
          </linearGradient>
        </defs>
        <circle cx="46" cy="46" r={r} fill="none" stroke="#F3ECE7" strokeWidth="7" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={`url(#mr-${id})`} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={inView ? c * (1 - value / 100) : c} transform="rotate(-90 46 46)"
          className="rl-ring" style={delay(index * 120)} />
        <text x="46" y="53" textAnchor="middle" fontSize="24" fill="#231F20" fontFamily="'Instrument Serif', Georgia, serif">
          {inView ? <CountUp value={value} duration={1200 + index * 120} /> : 0}
        </text>
      </svg>
      <p className="mt-2 text-[13px] font-semibold text-heading">{label}</p>
      <span className={`mt-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${tone.chip}`}>{tone.label}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   24-hour routine dial
──────────────────────────────────────────────────────────────────────────── */

export interface DialStep {
  productId: ProductId;
  when: "AM" | "PM";
}

/** Clock face showing the suggested morning and evening windows, about 12 hours apart. */
export function DayDial({ steps, size = 300 }: { steps: DialStep[]; size?: number }) {
  const id = useId().replace(/:/g, "");
  const { ref, inView } = useInView<SVGSVGElement>(0.3);
  const C = 150;
  const R = 112;
  const toXY = (hour: number, r: number) => {
    const a = (hour / 24) * Math.PI * 2 - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
  };
  const arc = (h1: number, h2: number, r: number) => {
    const [x1, y1] = toXY(h1, r);
    const [x2, y2] = toXY(h2, r);
    const large = h2 - h1 > 12 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const am = steps.filter((s) => s.when === "AM");
  const pm = steps.filter((s) => s.when === "PM");
  const place = (list: DialStep[], start: number, end: number) =>
    list.map((s, i) => ({ ...s, hour: start + ((i + 0.5) / list.length) * (end - start) }));
  const markers = [...place(am, 6.5, 9), ...place(pm, 20.5, 23)];
  const arcLen = (hrs: number) => (hrs / 24) * 2 * Math.PI * R;

  return (
    <svg ref={ref} width={size} height={size} viewBox="-12 -12 324 324" role="img"
      aria-label="Your routine on a 24-hour clock: morning steps around 6:30 to 9am, evening steps around 8:30 to 11pm, about twelve hours apart">
      <defs>
        <linearGradient id={`am-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7C9A8" />
          <stop offset="100%" stopColor="#E08A6E" />
        </linearGradient>
        <linearGradient id={`pm-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8E9BDA" />
          <stop offset="100%" stopColor="#3D4C99" />
        </linearGradient>
        <radialGradient id={`face-${id}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F7F1EE" />
        </radialGradient>
      </defs>
      {/* day / night halves */}
      <path d={`${arc(6, 18, 134)} L ${toXY(18, 0)[0]} ${toXY(18, 0)[1]} Z`} fill="#FFF7EC" />
      <path d={`${arc(18, 30, 134)} L ${toXY(6, 0)[0]} ${toXY(6, 0)[1]} Z`} fill="#EEF0FA" />
      <circle cx={C} cy={C} r="134" fill="none" stroke="#E6E1DE" />
      <circle cx={C} cy={C} r="92" fill={`url(#face-${id})`} stroke="#EFE9E5" />
      {Array.from({ length: 24 }).map((_, h) => {
        const [x1, y1] = toXY(h, 134);
        const [x2, y2] = toXY(h, h % 6 === 0 ? 124 : 129);
        return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#BDB4AF" strokeWidth={h % 6 === 0 ? 1.4 : 0.8} />;
      })}
      {[0, 6, 12, 18].map((h) => {
        const [x, y] = toXY(h, 146);
        return (
          <text key={h} x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight={600} fill="#6E6869" fontFamily="Figtree, sans-serif">
            {String(h).padStart(2, "0")}
          </text>
        );
      })}
      {/* track + windows */}
      <circle cx={C} cy={C} r={R} fill="none" stroke="#F1EAE5" strokeWidth="14" />
      <path d={arc(6, 9.5, R)} fill="none" stroke={`url(#am-${id})`} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={arcLen(3.5)} strokeDashoffset={inView ? 0 : arcLen(3.5)} className="rl-ring" />
      <path d={arc(20, 23.5, R)} fill="none" stroke={`url(#pm-${id})`} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={arcLen(3.5)} strokeDashoffset={inView ? 0 : arcLen(3.5)} className="rl-ring" style={delay(300)} />
      {/* 12-hour gap */}
      <path d={arc(9.9, 19.6, 98)} fill="none" stroke="#231F20" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4"
        className={inView ? "rl-fade" : "opacity-0"} style={delay(900)} />
      {markers.map((m, i) => {
        const [x, y] = toXY(m.hour, R);
        return (
          <g key={`${m.productId}-${m.when}`} className={inView ? "rl-pop-in" : "opacity-0"} style={delay(700 + i * 120)}>
            <circle cx={x} cy={y} r="11" fill="#FFFFFF" stroke={m.when === "AM" ? "#C2593B" : "#3D4C99"} strokeWidth="1.5" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="10.5" fontWeight={700} fill="#231F20" fontFamily="Figtree, sans-serif">
              {m.when === "AM" ? am.findIndex((s) => s.productId === m.productId) + 1 : pm.findIndex((s) => s.productId === m.productId) + 1}
            </text>
          </g>
        );
      })}
      <text x={C} y={C - 10} textAnchor="middle" fontSize="30" fill="#231F20" fontFamily="'Instrument Serif', Georgia, serif">~12 hrs</text>
      <text x={C} y={C + 12} textAnchor="middle" fontSize="10" letterSpacing="1.6" fontWeight={600} fill="#6E6869" fontFamily="Figtree, sans-serif">
        BETWEEN ROUTINES
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Minutes per day, by step
──────────────────────────────────────────────────────────────────────────── */

export interface TimeStep {
  productId: ProductId;
  when: "AM" | "PM";
  minutes: number;
}

const CHART_LABEL: Record<ProductId, string> = {
  "face-wash": "Face Wash",
  strips: "Strip",
  "day-cream": "SPF50",
  cleanser: "Balm",
  "night-cream": "Night Cream",
};

export function DailyTimeChart({ steps }: { steps: TimeStep[] }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const groups = (["AM", "PM"] as const).map((when) => {
    const list = steps.filter((s) => s.when === when);
    return { when, list, total: list.reduce((n, s) => n + s.minutes, 0) };
  });
  const max = Math.max(...groups.map((g) => g.total), 1);
  return (
    <div ref={ref} className="space-y-5">
      {groups.map((g, gi) => (
        <div key={g.when}>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-heading">{g.when === "AM" ? "Morning" : "Evening"}</span>
            <span className="font-display text-2xl text-heading">
              ~{inView ? <CountUp value={g.total} duration={900} /> : 0} min
            </span>
          </div>
          <div className="flex h-12 w-full overflow-hidden rounded-2xl bg-[#F3ECE7]" style={{ width: `${(g.total / max) * 100}%`, minWidth: "40%" }}>
            {g.list.map((s, i) => {
              const p = PRODUCTS[s.productId];
              return (
                <div
                  key={`${s.productId}-${i}`}
                  title={`${p.shortName}: about ${s.minutes} min`}
                  className="relative flex h-full items-center justify-center overflow-hidden border-r-2 border-white px-1 text-[10.5px] font-semibold text-ink transition-[flex-grow] duration-1000 ease-out last:border-r-0"
                  style={{
                    flexGrow: inView ? s.minutes : 0.0001,
                    flexBasis: 0,
                    background: `linear-gradient(135deg, ${p.tone.from}, ${p.tone.to})`,
                    transitionDelay: `${gi * 200 + i * 120}ms`,
                  }}
                >
                  <span className="truncate">{CHART_LABEL[s.productId]}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Approximate hands-on time, from each product's directions, including the 2–3 minutes SPF needs to absorb.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   30-day calendar
──────────────────────────────────────────────────────────────────────────── */

const PHASES = [
  { from: 1, to: 7, name: "Getting started", color: "#FBE9C6", ink: "#8A6410" },
  { from: 8, to: 21, name: "Building the habit", color: "#E3EEDC", ink: "#2F6B45" },
  { from: 22, to: 30, name: "Your routine", color: "#E1E8F6", ink: "#3D4C99" },
];

export function MonthPlan() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref}>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 sm:gap-2">
        {Array.from({ length: 30 }).map((_, i) => {
          const day = i + 1;
          const phase = PHASES.find((p) => day >= p.from && day <= p.to)!;
          return (
            <div
              key={day}
              className="relative flex aspect-square flex-col justify-between rounded-xl p-1.5 transition-all duration-500 ease-out sm:p-2"
              style={{
                backgroundColor: day === 1 ? "#231F20" : phase.color,
                opacity: inView ? 1 : 0,
                transform: inView ? "none" : "scale(0.7)",
                transitionDelay: `${i * 28}ms`,
              }}
            >
              <span className="text-[11px] font-semibold leading-none" style={{ color: day === 1 ? "#FFFFFF" : phase.ink }}>{day}</span>
              {day === 1 ? (
                <span className="text-[8.5px] font-bold uppercase leading-none tracking-wide text-accent-yellow">Patch test</span>
              ) : (
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E08A6E]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4F5FA8]" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {PHASES.map((p) => (
          <span key={p.name} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: p.color }} />
            Days {p.from}–{p.to}: {p.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#E08A6E]" /> Morning</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#4F5FA8]" /> Evening</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Analysing / loading screen (real Rosaleigh photography)
──────────────────────────────────────────────────────────────────────────── */

export function AnalysisLoader({
  title,
  subtitle,
  steps,
  stepMs = 600,
  activeStep,
  media,
}: {
  /** Replaces the brand photo, e.g. with the user's own scanned photo. */
  media?: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  steps: string[];
  stepMs?: number;
  /** Controlled step index. If omitted the loader advances itself every `stepMs`. */
  activeStep?: number;
}) {
  const [auto, setAuto] = useState(0);
  const step = activeStep ?? auto;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (activeStep !== undefined) return;
    const t = window.setInterval(() => setAuto((s) => Math.min(s + 1, steps.length - 1)), stepMs);
    return () => window.clearInterval(t);
  }, [activeStep, stepMs, steps.length]);

  useEffect(() => {
    const target = Math.min(99, Math.round(((step + 1) / steps.length) * 100));
    const t = window.setInterval(() => {
      setPct((p) => (p >= target ? p : p + Math.max(1, Math.round((target - p) / 6))));
    }, 40);
    return () => window.clearInterval(t);
  }, [step, steps.length]);

  return (
    <section className="rl-enter mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[1.1fr_1fr] md:py-14">
      <div className="relative overflow-hidden rounded-[32px] bg-[#1d1a1b] shadow-[0_40px_80px_-40px_rgba(35,31,32,0.6)]">
        {media ?? (
          <StorePhoto
            file={BRAND_IMAGES.analysis}
            alt="Rosaleigh skin analysis"
            tone="#1d1a1b"
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
            className="aspect-[4/3] md:aspect-[5/4]"
            imgClassName="object-[78%_50%] scale-[1.02] animate-[rl-kenburns_14s_ease-in-out_infinite_alternate]"
          />
        )}
        {/* scanning sweep */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="rl-scan absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-[#F0C020]/15 to-[#F0C020]/60 mix-blend-screen"
            style={{ "--rl-scan-distance": "560px" } as React.CSSProperties} />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(60%_70%_at_75%_45%,#000,transparent)]" />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-black/35 px-4 py-3 text-white backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">{steps[Math.min(step, steps.length - 1)]}</span>
          <span className="font-display text-2xl tabular-nums">{pct}%</span>
        </div>
      </div>

      <div>
        <p className="rl-eyebrow">Rosaleigh Routine Finder</p>
        <h2 className="mt-3 text-5xl leading-[1.02]">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-surface">
          <div className="rl-shimmer h-full rounded-full bg-gradient-to-r from-honey to-accent-yellow transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-6 space-y-2.5">
          {steps.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-500 ${
                  active ? "bg-white shadow-[var(--shadow-card)] ring-1 ring-border" : ""
                } ${i > step ? "opacity-40" : "opacity-100"}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  done ? "bg-[#2F6B45] text-white" : active ? "bg-accent-yellow text-ink" : "border border-border"}`}>
                  {done ? <Check className="rl-pop h-3.5 w-3.5" strokeWidth={3} /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-ink" /> : null}
                </span>
                <span className={done || active ? "font-medium text-heading" : "text-muted-foreground"}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
