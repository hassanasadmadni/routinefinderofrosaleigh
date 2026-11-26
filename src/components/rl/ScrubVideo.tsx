import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";

/**
 * A video that plays forwards and backwards with the page scroll.
 * `progress` is the whole story's 0–1 scroll; this clip owns the slice
 * [start, end]. Falls back to normal looping playback with reduced motion.
 */
export function ScrubVideo({
  src,
  progress,
  start,
  end,
  active,
  reduce,
  label,
}: {
  src: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
  active: boolean;
  reduce: boolean | null;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const target = useRef(0);
  const raf = useRef(0);

  const seek = (v: number) => {
    const el = ref.current;
    if (!el || !el.duration || reduce) return;
    const local = Math.min(1, Math.max(0, (v - start) / (end - start)));
    target.current = local * (el.duration - 0.05);
    if (raf.current) return;
    const tick = () => {
      raf.current = 0;
      const video = ref.current;
      if (!video) return;
      // Ease towards the target so fast scrolling still looks smooth.
      const diff = target.current - video.currentTime;
      if (Math.abs(diff) > 0.02) {
        video.currentTime = video.currentTime + diff * 0.35;
        raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  useMotionValueEvent(progress, "change", (v) => {
    if (active) seek(v);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce && active) void el.play().catch(() => undefined);
    if (!active) el.pause();
    return () => cancelAnimationFrame(raf.current);
  }, [active, reduce]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      preload={active ? "auto" : "metadata"}
      loop={Boolean(reduce)}
      aria-label={label}
      onLoadedMetadata={() => seek(progress.get())}
      className="h-full w-full object-cover"
    />
  );
}
