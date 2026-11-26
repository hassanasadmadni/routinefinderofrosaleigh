import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Camera, ClipboardList, Lock, QrCode, ScanFace, Smartphone, Sparkles } from "lucide-react";
import logoMark from "@/assets/logo-mark.png";
import { BRAND_IMAGES } from "@/data/catalogue";
import { Reveal, StorePhoto } from "./Brand";

const EASE = [0.22, 1, 0.36, 1] as const;
const PRODUCTION_URL = "https://rosaleigh-routine-finder.vercel.app";

interface Props {
  onChoose: (path: "photo" | "quiz") => void;
}

/** The link encoded in the QR code: opens this site straight at the selfie scan. */
function useScanUrl() {
  const [url, setUrl] = useState(`${PRODUCTION_URL}/?start=scan`);
  useEffect(() => {
    setUrl(`${window.location.origin}/?start=scan`);
  }, []);
  return url;
}

const HEADLINE: { w: string; accent?: boolean }[] = [
  { w: "Scan" },
  { w: "your" },
  { w: "skin." },
  { w: "Get", accent: true },
  { w: "your", accent: true },
  { w: "routine.", accent: true },
];

export function ScanHero({ onChoose }: Props) {
  const reduce = useReducedMotion();
  const scanUrl = useScanUrl();

  return (
    <section className="mx-auto max-w-[1300px] px-4 pt-5 md:px-7 md:pt-7">
      <div
        className="relative isolate overflow-hidden rounded-[2rem] text-white"
        style={{
          background:
            "radial-gradient(60% 80% at 85% 30%, rgba(240,192,32,0.20) 0%, rgba(240,192,32,0) 60%), radial-gradient(50% 70% at 10% 100%, rgba(98,116,189,0.35) 0%, rgba(98,116,189,0) 60%), #141016",
        }}
      >
        {/* fine grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_70%_at_70%_40%,#000,transparent)]"
        />

        <div className="grid items-center gap-10 px-6 pb-10 pt-12 md:grid-cols-[1.08fr_0.92fr] md:gap-6 md:px-14 md:py-16">
          {/* Copy */}
          <div>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-yellow ring-1 ring-white/15"
            >
              <ScanFace className="h-3.5 w-3.5" /> Rosaleigh Skin Scan · Free
            </motion.p>
            <h1 className="mt-5 text-[3.1rem] leading-[0.96] !text-white md:text-[5rem]">
              {HEADLINE.map((t, i) => (
                <span key={t.w + i} className="contents">
                {i === 3 && <br />}
                <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                  <motion.span
                    className={`inline-block ${t.accent ? "italic text-accent-yellow" : ""}`}
                    initial={reduce ? false : { y: "105%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.9, delay: 0.35 + i * 0.07, ease: EASE }}
                  >
                    {t.w}&nbsp;
                  </motion.span>
                </span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
              className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/75 md:text-base"
            >
              Take a selfie and the scanner maps your face, reads your skin and builds your
              morning-to-evening Rosaleigh routine. About two minutes, and your photo never leaves your phone.
            </motion.p>

            {/* Desktop: QR */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
              className="mt-8 hidden items-center gap-5 md:flex"
            >
              <div className="relative rounded-[22px] bg-white p-3 shadow-[0_20px_50px_-20px_rgba(240,192,32,0.6)]">
                <QRCodeSVG
                  value={scanUrl}
                  size={132}
                  level="H"
                  fgColor="#231F20"
                  bgColor="#FFFFFF"
                  imageSettings={{ src: logoMark, height: 30, width: 30, excavate: true }}
                />
                {!reduce && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-x-3 h-[3px] rounded-full bg-accent-yellow shadow-[0_0_14px_3px_rgba(240,192,32,0.7)]"
                    initial={{ top: 12 }}
                    animate={{ top: [12, 142, 12] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>
              <div className="max-w-[240px]">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Smartphone className="h-4 w-4 text-accent-yellow" /> Scan with your phone camera
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-white/65">
                  Opens the skin scan on your phone. No app to download.
                </p>
                <button
                  type="button"
                  onClick={() => onChoose("photo")}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white underline decoration-white/30 underline-offset-[5px] hover:decoration-white"
                >
                  Or scan on this computer <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>

            {/* Mobile: button */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
              className="mt-8 md:hidden"
            >
              <button
                type="button"
                onClick={() => onChoose("photo")}
                className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-accent-yellow py-4 text-[15px] font-semibold text-ink"
              >
                <Camera className="h-4 w-4" /> Start my skin scan
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.3 }}
              className="mt-6"
            >
              <button
                type="button"
                onClick={() => onChoose("quiz")}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/75 hover:text-white"
              >
                <ClipboardList className="h-4 w-4" /> Prefer questions? Take the 2-minute quiz
              </button>
              <dl className="mt-7 grid max-w-md grid-cols-3 divide-x divide-white/12 border-t border-white/12 pt-5">
                {[
                  ["478", "points mapped on your face"],
                  ["4", "skin readings from your photo"],
                  ["0", "photos uploaded, ever"],
                ].map(([n, l]) => (
                  <div key={l} className="px-3 first:pl-0">
                    <dt className="font-display text-4xl leading-none text-white">{n}</dt>
                    <dd className="mt-1.5 text-[11.5px] leading-snug text-white/60">{l}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>

          {/* Phone */}
          <PhoneDemo />
        </div>
      </div>
    </section>
  );
}

/* ── Phone mockup with an example scan, tilting in 3D with the pointer ──── */

const DEMO_CHIPS = [
  { label: "T-zone", value: "Shine · Moderate", x: "-18%", y: "18%", side: "left" as const },
  { label: "Cheeks", value: "Redness · Low", x: "-16%", y: "31%", side: "right" as const },
  { label: "Tone", value: "Evenness · Even", x: "-22%", y: "46%", side: "left" as const },
  { label: "Texture", value: "Smoothness · Smooth", x: "-20%", y: "60%", side: "right" as const },
];

function PhoneDemo() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 18 });
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setCycle((c) => c + 1), 6000);
    return () => window.clearInterval(t);
  }, [reduce]);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || reduce) return;
    const b = el.getBoundingClientRect();
    mx.set((e.clientX - b.left) / b.width - 0.5);
    my.set((e.clientY - b.top) / b.height - 0.5);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative mx-auto w-full max-w-[460px] [perspective:1200px]"
    >
      <motion.div
        style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        initial={reduce ? false : { opacity: 0, y: 40, rotateY: -18 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
        className="relative mx-auto w-[70%] min-w-[220px]"
      >
        {/* device */}
        <div className="relative aspect-[9/19] rounded-[44px] bg-[#0b0a0c] p-[10px] shadow-[0_60px_100px_-40px_rgba(0,0,0,0.9),inset_0_0_0_1.5px_rgba(255,255,255,0.12)]">
          <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#1d1a1b]">
            <StorePhoto
              file={BRAND_IMAGES.analysis}
              alt="Example of the Rosaleigh skin scan on a face"
              tone="#1d1a1b"
              priority
              sizes="300px"
              widths={[480, 768]}
              className="absolute inset-0"
              imgClassName="object-[80%_40%]"
            />
            {/* grid + beam */}
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(55%_45%_at_55%_45%,#000,transparent)]" />
            {!reduce && (
              <motion.div
                key={cycle}
                className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[#F0C020]/20 to-[#FFE58A]/80 mix-blend-screen"
                initial={{ top: "-20%" }}
                animate={{ top: "110%" }}
                transition={{ duration: 2.4, ease: "easeInOut" }}
              />
            )}
            {/* notch + UI */}
            <div className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <div className="absolute inset-x-3 top-11 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
              <span>Skin scan</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> On device</span>
            </div>
            <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 p-3 text-ink backdrop-blur">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-highlight">Your routine</p>
              <p className="mt-0.5 font-display text-xl leading-tight">AM + PM routine</p>
              <div className="mt-2 flex gap-1">
                {["#F6E7F1", "#E8EDD8", "#FBE3D6", "#E6EFDF", "#F6E7F1", "#D9DDF5"].map((c, i) => (
                  <span key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* floating reading chips (in front, with depth) */}
        {DEMO_CHIPS.map((c, i) => (
          <motion.div
            key={`${c.label}-${cycle}`}
            className="absolute z-10 whitespace-nowrap rounded-2xl bg-white px-3 py-2 text-ink shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
            style={c.side === "right" ? { right: c.x, top: c.y, z: 60 } : { left: c.x, top: c.y, z: 60 }}
            initial={reduce ? false : { opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: (reduce ? 0 : 1.4) + i * 0.35, ease: EASE }}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{c.label}</p>
            <p className="text-[12.5px] font-semibold">{c.value}</p>
          </motion.div>
        ))}
        <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/45">Example scan</span>
      </motion.div>
    </div>
  );
}

/* ── How the scan works ──────────────────────────────────────────────────── */

const STEPS = [
  { icon: QrCode, title: "Scan the QR code", body: "Point your phone camera at the code. The scan opens in your browser." },
  { icon: Camera, title: "Take a selfie", body: "Face the camera in natural light, or upload a recent photo." },
  { icon: ScanFace, title: "We read your skin", body: "478 points mapped and four readings taken, all on your phone." },
  { icon: Sparkles, title: "Get your routine", body: "Confirm three details and get your AM/PM routine and 30-day plan." },
];

export function ScanSteps() {
  return (
    <section className="mx-auto mt-20 max-w-[1300px] px-4 md:mt-28 md:px-7">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="rl-eyebrow">How it works</p>
        <h2 className="mt-3 text-[2.6rem] leading-[1.02] md:text-6xl">
          Personalised skin analysis in <em className="italic text-highlight">four simple steps.</em>
        </h2>
      </Reveal>
      <Reveal className="relative mt-14">
        <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-[2px] bg-border md:block">
          <div className="rl-line h-full rounded-full bg-gradient-to-r from-[#EB9F86] via-accent-yellow to-[#6274BD]" />
        </div>
        <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-white ring-[6px] ring-background">
                <s.icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-yellow text-[11px] font-bold text-ink">
                  {i + 1}
                </span>
              </span>
              <div>
                <h3 className="text-[1.7rem] leading-tight md:mt-5">{s.title}</h3>
                <p className="mt-1.5 max-w-[260px] text-[13.5px] leading-relaxed text-muted-foreground md:mx-auto">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
