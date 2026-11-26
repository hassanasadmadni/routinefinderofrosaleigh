import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { PRODUCTS, storeImage, storeSrcSet, type ProductId } from "@/data/catalogue";

/**
 * Slides its children up into view the first time they scroll on screen.
 * Without JavaScript, or with reduced motion, content is simply shown.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`rl-reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--rl-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Counts up from 0 to `value` once mounted. */
export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{shown}</>;
}

/**
 * A photograph from the Rosaleigh store, served responsively from Shopify's CDN.
 * Shows a tone-coloured placeholder and fades the image in once loaded.
 */
export function StorePhoto({
  file,
  alt,
  sizes = "(min-width: 768px) 50vw, 100vw",
  tone = "#F3ECE7",
  className = "",
  imgClassName = "",
  priority = false,
  widths,
}: {
  file: string;
  alt: string;
  sizes?: string;
  tone?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  widths?: number[];
}) {
  const [loaded, setLoaded] = useState(false);
  // A cancelled or failed request (flaky mobile networks, aborted lazy loads)
  // leaves a blank tile; retry up to twice with a fresh URL.
  const [attempt, setAttempt] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  const retry = () => {
    if (attempt >= 2) return;
    window.setTimeout(() => setAttempt((a) => a + 1), 400 * (attempt + 1));
  };
  useEffect(() => {
    const el = ref.current;
    if (!el?.complete) return;
    if (el.naturalWidth > 0) setLoaded(true);
    else if (el.currentSrc) retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);
  const bust = (url: string) => (attempt ? url.replace(/ (\d+w)/g, `&r=${attempt} $1`) : url);
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden ${className}`} style={{ backgroundColor: tone }}>
      <img
        ref={ref}
        src={attempt ? `${storeImage(file, 1080)}&r=${attempt}` : storeImage(file, 1080)}
        srcSet={bust(storeSrcSet(file, widths))}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        onLoad={() => setLoaded(true)}
        onError={retry}
        className={`h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
      />
    </div>
  );
}

/**
 * A product's store photograph (water-droplet studio shot), square-cropped.
 * Zooms gently on hover when inside a `.group`.
 */
export function ProductTile({
  id,
  label,
  className = "",
  rounded = "rounded-[20px]",
  sizes = "(min-width: 768px) 25vw, 50vw",
}: {
  id: ProductId;
  label?: string;
  className?: string;
  /** kept for compatibility; photos fill the tile */
  imgClassName?: string;
  rounded?: string;
  sizes?: string;
}) {
  const product = PRODUCTS[id];
  return (
    <div className={`relative aspect-square overflow-hidden ${rounded} ${className}`}>
      <StorePhoto
        file={product.photo}
        alt={product.name}
        tone={product.photoTone}
        sizes={sizes}
        widths={[240, 480, 720]}
        className="absolute inset-0"
        imgClassName="group-hover:scale-[1.05]"
      />
      {label && <span className="rl-pill absolute left-3 top-3">{label}</span>}
    </div>
  );
}

/** Heading text with one italic accent phrase, e.g. "Morning, anytime, *evening*." */
export function Accent({ children, tone = "inherit" }: { children: ReactNode; tone?: "inherit" | "yellow" | "brown" }) {
  const color =
    tone === "yellow" ? "text-accent-yellow" : tone === "brown" ? "text-highlight" : "";
  return <em className={`italic ${color}`}>{children}</em>;
}
