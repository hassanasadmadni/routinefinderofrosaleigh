import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Lock, ScanFace, Sparkles } from "lucide-react";
import { QUIZ, type QuizAnswers } from "@/data/quiz";
import { describeReadings, scanPhoto, type PhotoReadings, type ScanResult } from "@/lib/skin-scan";
import { BackLink } from "./PhotoUpload";

/** The user's photo and its face map, kept in memory only (never saved or uploaded). */
export interface ScanPhoto {
  url: string;
  w: number;
  h: number;
  scan: ScanResult | null;
}

interface Props {
  imageUrl: string;
  onBack: () => void;
  onComplete: (answers: QuizAnswers, readings: PhotoReadings | null, photo: ScanPhoto | null) => void;
}

export type Phase = "loading" | "mapping" | "reading" | "confirm" | "failed";

const EASE = [0.22, 1, 0.36, 1] as const;

const STATUS: Record<Phase, string> = {
  loading: "Preparing the scanner",
  mapping: "Mapping 478 points on your face",
  reading: "Reading your skin",
  confirm: "Scan complete",
  failed: "We couldn't map your face clearly",
};

export function SkinScan({ imageUrl, onBack, onComplete }: Props) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("loading");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [shown, setShown] = useState(0); // readings revealed so far

  // Natural image size, for the overlay coordinate system.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  // Run the scan.
  useEffect(() => {
    let alive = true;
    const started = Date.now();
    scanPhoto(imageUrl)
      .then((res) => {
        if (!alive) return;
        // Give the "preparing" beam a moment so the reveal reads as a sequence.
        const wait = Math.max(0, 1200 - (Date.now() - started));
        window.setTimeout(() => {
          if (!alive) return;
          if (!res) return setPhase("failed");
          setScan(res);
          setPhase("mapping");
        }, wait);
      })
      .catch(() => alive && setPhase("failed"));
    return () => {
      alive = false;
    };
  }, [imageUrl]);

  // Sequence: mesh reveal → readings one by one → confirm.
  useEffect(() => {
    if (phase === "mapping") {
      const t = window.setTimeout(() => setPhase("reading"), reduce ? 200 : 1900);
      return () => window.clearTimeout(t);
    }
    if (phase === "reading") {
      if (shown >= 4) {
        const t = window.setTimeout(() => setPhase("confirm"), reduce ? 200 : 900);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setShown((n) => n + 1), reduce ? 80 : 750);
      return () => window.clearTimeout(t);
    }
  }, [phase, shown, reduce]);

  const readings = scan ? describeReadings(scan.readings) : [];

  return (
    <section className="rl-enter mx-auto grid max-w-[1200px] gap-8 px-4 pt-6 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:px-7 md:pt-10">
      {/* Photo + overlay */}
      <div>
        <BackLink onClick={onBack} />
        <div className="relative mt-5 overflow-hidden rounded-[28px] bg-[#141016] shadow-[0_40px_80px_-40px_rgba(35,31,32,0.6)]">
          {dims ? (
            <ScanOverlay imageUrl={imageUrl} w={dims.w} h={dims.h} phase={phase} scan={scan} shown={shown} />
          ) : (
            <div className="aspect-[3/4] animate-pulse bg-[#221b20]" />
          )}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl bg-black/45 px-4 py-3 text-white backdrop-blur-md">
            <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]">
              {phase === "confirm" ? (
                <Check className="h-4 w-4 text-accent-yellow" />
              ) : phase === "failed" ? (
                <ScanFace className="h-4 w-4" />
              ) : (
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-yellow" />
              )}
              {STATUS[phase]}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-white/75">
              <Lock className="h-3.5 w-3.5" /> On your device
            </span>
          </div>
        </div>
      </div>

      {/* Panel */}
      <div className="md:pt-12">
        <p className="rl-eyebrow">Rosaleigh skin scan</p>
        <AnimatePresence mode="wait">
          {phase !== "confirm" && phase !== "failed" ? (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
              <h1 className="mt-3 text-5xl leading-[1.02] md:text-6xl">
                Scanning <em className="italic text-highlight">your skin…</em>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                We're mapping your face and taking four readings from your photo. It all happens here on your device.
              </p>
              <ReadingsList readings={readings} shown={phase === "reading" ? shown : 0} pending={phase !== "reading"} />
            </motion.div>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              <h1 className="mt-3 text-5xl leading-[1.02] md:text-6xl">
                {phase === "failed" ? (
                  <>Three quick <em className="italic text-highlight">questions.</em></>
                ) : (
                  <>Your scan, <em className="italic text-highlight">confirmed by you.</em></>
                )}
              </h1>
              {phase === "failed" ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  We couldn't map your face clearly in this photo, usually because of lighting or angle. No problem: answer
                  three quick questions and we'll build your routine.
                </p>
              ) : (
                <ReadingsSummary readings={readings} />
              )}
              <Confirm scan={scan} onComplete={(a) =>
                  onComplete(a, scan?.readings ?? null, dims ? { url: imageUrl, w: dims.w, h: dims.h, scan } : null)
                } />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ── Overlay on the user's photo ─────────────────────────────────────────── */

export function ScanOverlay({
  imageUrl,
  w,
  h,
  phase,
  scan,
  shown,
}: {
  imageUrl: string;
  w: number;
  h: number;
  phase: Phase;
  scan: ScanResult | null;
  shown: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduce = useReducedMotion();
  const meshPath = useMemo(() => {
    if (!scan) return "";
    const p = scan.landmarks;
    let d = "";
    for (const [a, b] of scan.mesh) {
      const A = p[a];
      const B = p[b];
      if (!A || !B) continue;
      d += `M${(A.x * w).toFixed(1)} ${(A.y * h).toFixed(1)}L${(B.x * w).toFixed(1)} ${(B.y * h).toFixed(1)}`;
    }
    return d;
  }, [scan, w, h]);
  const revealed = phase === "reading" || phase === "confirm";
  const scanning = phase === "loading" || phase === "mapping";

  // Frame the face: crop in so the face fills about 40% of the width (4:5 at most),
  // leaving room beside it for the reading labels.
  const box = useMemo(() => {
    if (!scan) return { x0: 0, x1: w, y0: 0, y1: h };
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
    for (const p of scan.landmarks) {
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    return { x0: x0 * w, x1: x1 * w, y0: y0 * h, y1: y1 * h };
  }, [scan, w, h]);
  const faceW = box.x1 - box.x0;
  const faceCx = (box.x0 + box.x1) / 2;
  const faceCy = (box.y0 + box.y1) / 2;
  let viewW = Math.min(w, Math.max(faceW * 2.5, w * 0.45));
  let viewH = Math.min(h, viewW * 1.25);
  if (viewH < viewW * 0.75) viewW = Math.min(w, viewH / 0.75);
  viewH = Math.min(h, Math.max(viewH, viewW * 0.75));
  const viewX = Math.max(0, Math.min(w - viewW, faceCx - viewW / 2));
  const viewY = Math.max(0, Math.min(h - viewH, faceCy - viewH / 2));
  const ratio = viewH / viewW;
  const u = viewW / 900; // one "pixel" at a 900-wide frame
  const strokeV = Math.max(0.6, u);

  // Reading labels: one column on the side of the face with more room, stacked in order.
  const readingsByKey = useMemo(
    () => (scan ? new Map(describeReadings(scan.readings).map((r) => [r.key, r])) : new Map()),
    [scan],
  );
  const chips = useMemo(() => {
    if (!scan) return [];
    const roomLeft = box.x0 - viewX;
    const roomRight = viewX + viewW - box.x1;
    const onRight = roomRight >= roomLeft;
    const chipW = 230 * u;
    const chipH = 74 * u;
    const gap = 16 * u;
    const pad = 18 * u;
    const x = onRight
      ? Math.min(viewX + viewW - chipW - pad, Math.max(box.x1 + 24 * u, viewX + viewW - chipW - pad))
      : Math.max(viewX + pad, Math.min(box.x0 - chipW - 24 * u, viewX + pad));
    const sorted = scan.zones
      .map((z, i) => ({ z, i, cy: z.at.y * h }))
      .sort((a, b) => a.cy - b.cy);
    const total = sorted.length * chipH + (sorted.length - 1) * gap;
    const centre = sorted.reduce((a, c) => a + c.cy, 0) / Math.max(1, sorted.length);
    let y = Math.max(viewY + pad, Math.min(viewY + viewH - total - pad - 70 * u, centre - total / 2));
    return sorted.map(({ z, i }) => {
      const out = { z, i, x, y, w: chipW, h: chipH, onRight };
      y += chipH + gap;
      return out;
    });
  }, [scan, box, viewX, viewY, viewW, viewH, u, h]);

  return (
    <svg viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`} className="block w-full" style={{ aspectRatio: `${viewW} / ${viewH}` }} role="img"
      aria-label="Your photo with a face map and skin reading zones" data-ratio={ratio}>
      <defs>
        <linearGradient id={`beam-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0C020" stopOpacity="0" />
          <stop offset="85%" stopColor="#F0C020" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFE58A" stopOpacity="0.95" />
        </linearGradient>
        <clipPath id={`mesh-reveal-${uid}`}>
          <motion.rect
            x={viewX}
            y={viewY}
            width={viewW}
            initial={{ height: 0 }}
            animate={{ height: phase === "loading" ? 0 : viewH }}
            transition={{ duration: reduce ? 0 : 1.7, ease: "easeInOut" }}
          />
        </clipPath>
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="45%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
      </defs>

      <image href={imageUrl} x="0" y="0" width={w} height={h} preserveAspectRatio="none" />
      <rect x={viewX} y={viewY} width={viewW} height={viewH} fill={`url(#vignette-${uid})`} />
      {revealed && <rect x={viewX} y={viewY} width={viewW} height={viewH} fill="#141016" opacity="0.18" />}

      {/* Face mesh */}
      {scan && (
        <g clipPath={`url(#mesh-reveal-${uid})`}>
          <path d={meshPath} fill="none" stroke="#FFFFFF" strokeOpacity={revealed ? 0.22 : 0.4} strokeWidth={strokeV} />
          {scan.landmarks.map((p, i) =>
            i % 6 === 0 ? <circle key={i} cx={p.x * w} cy={p.y * h} r={strokeV * 1.6} fill="#F0C020" opacity={0.85} /> : null,
          )}
        </g>
      )}

      {/* Scanning beam */}
      {scanning && !reduce && (
        <motion.rect
          x={viewX}
          width={viewW}
          height={viewH * 0.16}
          fill={`url(#beam-${uid})`}
          initial={{ y: viewY - viewH * 0.16 }}
          animate={{ y: viewY + viewH }}
          transition={{ duration: phase === "mapping" ? 1.7 : 2.2, ease: "easeInOut", repeat: phase === "loading" ? Infinity : 0 }}
        />
      )}

      {/* Reading zones */}
      {scan &&
        scan.zones.map((z, i) => {
          if (!(phase === "confirm" || i < shown)) return null;
          const cx = z.at.x * w;
          const cy = z.at.y * h;
          const r = z.r * w;
          return (
            <motion.g key={z.key} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE }} style={{ transformOrigin: `${cx}px ${cy}px` }}>
              <circle cx={cx} cy={cy} r={r} fill="#F0C020" fillOpacity={0.12} stroke="#F0C020" strokeWidth={strokeV * 2} />
              <motion.circle cx={cx} cy={cy} r={r * 1.25} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={strokeV}
                strokeDasharray={`${r * 0.25} ${r * 0.18}`} animate={reduce ? undefined : { rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: `${cx}px ${cy}px` }} />
            </motion.g>
          );
        })}

      {/* Reading labels with leader lines */}
      {chips.map((c) => {
        if (!(phase === "confirm" || c.i < shown)) return null;
        const reading = readingsByKey.get(c.z.key);
        if (!reading) return null;
        const cx = c.z.at.x * w;
        const cy = c.z.at.y * h;
        const r = c.z.r * w;
        const ax = c.onRight ? c.x : c.x + c.w;
        const ay = c.y + c.h / 2;
        const sx = c.onRight ? cx + r : cx - r;
        const elbow = c.onRight ? ax - 22 * u : ax + 22 * u;
        return (
          <motion.g key={`chip-${c.z.key}`} initial={{ opacity: 0, x: c.onRight ? 12 * u : -12 * u }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE }}>
            <polyline points={`${sx},${cy} ${elbow},${ay} ${ax},${ay}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={strokeV * 1.2} />
            <circle cx={sx} cy={cy} r={strokeV * 3} fill="#FFFFFF" />
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={18 * u} fill="#FFFFFF" />
            <text x={c.x + 20 * u} y={c.y + 29 * u} fontSize={15 * u} fontWeight={700} fill="#8A8384"
              fontFamily="Figtree, sans-serif" letterSpacing={1.2 * u}>{reading.label.toUpperCase()}</text>
            <text x={c.x + 20 * u} y={c.y + 57 * u} fontSize={23 * u} fontWeight={700} fill="#231F20"
              fontFamily="Figtree, sans-serif">{reading.verdict}</text>
          </motion.g>
        );
      })}
    </svg>
  );
}

/* ── Readings ────────────────────────────────────────────────────────────── */

function ReadingsList({
  readings,
  shown,
  pending,
}: {
  readings: ReturnType<typeof describeReadings>;
  shown: number;
  pending: boolean;
}) {
  const labels = ["Shine · T-zone", "Redness · Cheeks", "Tone evenness", "Smoothness · Cheeks"];
  return (
    <ol className="mt-8 space-y-3">
      {labels.map((label, i) => {
        const r = readings[i];
        const done = !pending && r && i < shown;
        return (
          <li key={label} className={`rounded-2xl px-4 py-3.5 ring-1 transition-colors duration-500 ${done ? "bg-white ring-border" : "bg-surface ring-transparent"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`flex items-center gap-2.5 text-sm font-semibold ${done ? "text-heading" : "text-muted-foreground"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-[#2F6B45] text-white" : "border border-border"}`}>
                  {done ? <Check className="rl-pop h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/50" />}
                </span>
                {label}
              </span>
              <span className="text-sm font-semibold text-heading">{done ? r!.verdict : "…"}</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#EFE9E5]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-honey to-accent-yellow"
                initial={{ width: 0 }}
                animate={{ width: done ? `${r!.value}%` : "0%" }}
                transition={{ duration: 0.9, ease: EASE }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ReadingsSummary({ readings }: { readings: ReturnType<typeof describeReadings> }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      {readings.map((r) => (
        <div key={r.key} className="rounded-2xl bg-surface px-3.5 py-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{r.label}</p>
          <p className="mt-1 text-[15px] font-semibold text-heading">{r.verdict}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E9E1DB]">
            <div className="h-full rounded-full bg-gradient-to-r from-honey to-accent-yellow" style={{ width: `${r.value}%` }} />
          </div>
        </div>
      ))}
      <p className="col-span-2 mt-1 text-[11.5px] leading-snug text-muted-foreground">
        Photo readings, not a diagnosis. Lighting, camera and make-up affect them, so please confirm the details below.
      </p>
    </div>
  );
}

/* ── Three confirm taps ──────────────────────────────────────────────────── */

const Q = (id: keyof QuizAnswers) => QUIZ.find((q) => q.id === id)!;

function Confirm({ scan, onComplete }: { scan: ScanResult | null; onComplete: (a: QuizAnswers) => void }) {
  const s = scan?.suggestion;
  const [skinType, setSkinType] = useState<string | undefined>(s?.skinType);
  const [concern, setConcern] = useState<string | undefined>(s?.concern);
  const [spf, setSpf] = useState<string | undefined>();
  const ready = Boolean(skinType && concern && spf);

  const submit = () => {
    if (!skinType || !concern || !spf) return;
    onComplete({
      age: "unspecified",
      skinType,
      hydration: skinType === "oily" ? "oily" : skinType === "dry" || concern === "dryness" ? "tight" : "balanced",
      concern,
      routine: "unspecified",
      spf,
    });
  };

  return (
    <div className="mt-8 space-y-6">
      <TapRow n={1} title="Your skin type" options={Q("skinType").options} value={skinType} suggested={s?.skinType} onChange={setSkinType}
        hint={s?.sensitiveHint ? "Your cheeks showed some redness. If your skin is often reactive, choose Sensitive." : undefined} />
      <TapRow n={2} title="What would you most like to improve?" options={Q("concern").options} value={concern} suggested={s?.concern} onChange={setConcern} />
      <TapRow n={3} title="How often do you wear SPF?" options={Q("spf").options} value={spf} onChange={setSpf} />
      <button
        type="button"
        disabled={!ready}
        onClick={submit}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-yellow px-8 py-4 text-[15px] font-semibold text-ink transition-all duration-300 enabled:hover:bg-ink enabled:hover:text-white disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" /> Build my routine
        <ArrowRight className="h-4 w-4 transition-transform group-enabled:group-hover:translate-x-1" />
      </button>
    </div>
  );
}

function TapRow({
  n,
  title,
  options,
  value,
  suggested,
  onChange,
  hint,
}: {
  n: number;
  title: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  suggested?: string | undefined;
  onChange: (v: string) => void;
  hint?: string | undefined;
}) {
  return (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-semibold text-heading">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{n}</span>
        {title}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`relative rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all duration-200 ${
                on ? "bg-ink text-white" : "bg-white text-heading ring-1 ring-border hover:ring-ink/40"
              }`}
            >
              {o.label}
              {suggested === o.value && (
                <span className={`ml-1.5 rounded-full px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide ${on ? "bg-accent-yellow text-ink" : "bg-[#FBF0CF] text-[#8A6410]"}`}>
                  From scan
                </span>
              )}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-2 text-[12px] leading-snug text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}
