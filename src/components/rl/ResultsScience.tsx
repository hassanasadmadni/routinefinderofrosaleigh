// Results "Science" tab: where each product in this routine works (skin layers),
// then the science behind each step. Claims are cosmetic; the strips use only
// their authorised nutrition claims. Depths are typical facial values.
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { PRODUCTS, type ProductId } from "@/data/catalogue";
import { ProductTile, Reveal, StorePhoto } from "./Brand";
import { Science } from "./Science";
import illoStrips from "@/assets/science/science-strips.webp";
import illoSpf from "@/assets/science/science-spf.webp";
import illoBalm from "@/assets/science/science-balm.webp";
import illoNight from "@/assets/science/science-night.webp";

/** Scientific illustrations (artwork, not product test results). */
const ILLUSTRATION: Partial<Record<ProductId, { src: string; caption: string }>> = {
  strips: {
    src: illoStrips,
    caption: "Illustration: a strip dissolving on the thin, vessel-rich membrane under the tongue.",
  },
  "day-cream": {
    src: illoSpf,
    caption: "Illustration: UVB is absorbed near the surface while UVA travels deeper, into the collagen of the dermis.",
  },
  cleanser: {
    src: illoBalm,
    caption: "Illustration: the skin barrier, with cells held together by lipids under a slightly acidic surface film.",
  },
  "night-cream": {
    src: illoNight,
    caption: "Illustration: skin's layers, from the surface down to the collagen-making cells of the dermis.",
  },
};

const EASE = [0.22, 1, 0.36, 1] as const;

type LayerId = "surface" | "epidermis" | "dermis" | "within";

interface Layer {
  id: LayerId;
  depth: string;
  name: string;
  detail: string;
  about: string;
  fill: string;
  h: number;
  works: Partial<Record<ProductId, string>>;
}

const LAYERS: Layer[] = [
  {
    id: "surface",
    depth: "0–20 μm",
    name: "Surface",
    detail: "Stratum corneum",
    about: "The skin's outer barrier: flattened cells held together by lipids, with a slightly acidic film on top.",
    fill: "#F6E3D8",
    h: 46,
    works: {
      cleanser: "Melts and lifts make-up, SPF and excess oil from the surface.",
      "face-wash": "Clears what's left; salicylic acid works into the pores.",
      "day-cream": "The SPF50 filters sit here as an even film, filtering UV before it goes deeper.",
    },
  },
  {
    id: "epidermis",
    depth: "20–100 μm",
    name: "Epidermis",
    detail: "Living skin cells",
    about: "Living cells that move up and renew the surface roughly every month.",
    fill: "#F1CDBE",
    h: 70,
    works: {
      "night-cream": "Moisturises overnight; NMN, PDRN and peptides help skin look firmer and smoother.",
      "day-cream": "Niacinamide, tranexamic acid and hyaluronic acid help tone look even and skin feel hydrated.",
    },
  },
  {
    id: "dermis",
    depth: "0.1–2 mm",
    name: "Dermis",
    detail: "Collagen & elastin",
    about: "The support layer that gives skin its firmness and bounce. UVA reaches this deep and breaks down collagen over time.",
    fill: "#E7AE9B",
    h: 104,
    works: {
      "day-cream": "Protects it from above: daily SPF is the best-proven way to shield collagen from UV damage.",
    },
  },
  {
    id: "within",
    depth: "Inside-out",
    name: "From within",
    detail: "Via your diet",
    about: "Skin is also fed from the inside, by the nutrients in what you eat and drink.",
    fill: "#B8C4A1",
    h: 56,
    works: {
      strips: "Biotin contributes to the maintenance of normal skin. Niacin and B12 contribute to normal energy-yielding metabolism.",
    },
  },
];

interface Story {
  id: ProductId;
  title: string;
  body: string[];
  stat: { value: string; label: string };
}

const STORIES: Story[] = [
  {
    id: "cleanser",
    title: "Cleansing without stripping",
    body: [
      "Skin's surface carries a slightly acidic film, the acid mantle, that helps hold moisture in. Harsh cleansing can leave it feeling tight.",
      "Make-up, SPF and sebum are oily, and oil dissolves oil. The tallow, whose fatty acids are similar to skin's own lipids, melts them on a dry face, then turns milky with water and rinses away.",
    ],
    stat: { value: "pH 4.5–5.5", label: "the usual range of skin's acid mantle" },
  },
  {
    id: "face-wash",
    title: "A second cleanse that reaches the pores",
    body: [
      "Most acids dissolve only in water. Salicylic acid, a BHA, also dissolves in oil, so it can work inside pores where oil collects.",
      "Used after the balm, the face wash clears what's left, so your Night Cream goes onto clean skin.",
    ],
    stat: { value: "BHA", label: "oil-soluble, so it works where oil builds up" },
  },
  {
    id: "day-cream",
    title: "Stopping photoageing at the source",
    body: [
      "A study of 298 women found UV exposure accounted for around 80% of the visible signs of facial ageing. UVB burns the surface; UVA reaches the dermis and breaks down collagen.",
      "SPF50 filters about 98% of UVB, with high UVA protection, and it only works at the right amount: two finger-lengths, every morning, as the last step.",
    ],
    stat: { value: "80%", label: "of visible facial ageing signs linked to UV in one study" },
  },
  {
    id: "night-cream",
    title: "Care while you rest",
    body: [
      "Night is the longest stretch your skin goes without washing, SPF or make-up, so an overnight cream has hours to absorb undisturbed.",
      "NMN, PDRN and peptides help skin look firmer and more youthful, while soluble collagen holds moisture so skin feels soft by morning.",
    ],
    stat: { value: "7–9 h", label: "of sleep: the longest window in your day" },
  },
  {
    id: "strips",
    title: "Inside-out, in one easy step",
    body: [
      "The strip is a food supplement in a thin film that dissolves under your tongue in moments. No water and nothing to swallow, so it's easy to take at the same time every morning.",
      "Biotin contributes to the maintenance of normal skin. Niacin and vitamin B12 contribute to normal energy-yielding metabolism.",
    ],
    stat: { value: "1 a day", label: "with your morning routine; never more than one" },
  },
];

export function ResultsScience({ ids }: { ids: ProductId[] }) {
  return (
    <div className="space-y-14">
      <LayerExplorer ids={ids} />
      <Stories ids={ids} />
      <Science products={ids} embedded />
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Source:{" "}
        <a
          className="underline underline-offset-2"
          href="https://pubmed.ncbi.nlm.nih.gov/24101874/"
          target="_blank"
          rel="noreferrer"
        >
          Flament F. et al. Effect of the sun on visible clinical signs of aging in Caucasian skin. Clin Cosmet Investig
          Dermatol, 2013.
        </a>{" "}
        Layer depths are typical values for facial skin and vary from person to person.
      </p>
    </div>
  );
}

/* ── Where each product works ────────────────────────────────────────────── */

function LayerExplorer({ ids }: { ids: ProductId[] }) {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<LayerId>("surface");
  const layer = LAYERS.find((l) => l.id === sel)!;
  const mine = (l: Layer) => (Object.keys(l.works) as ProductId[]).filter((id) => ids.includes(id));
  const W = 440;
  let y = 30;
  const bands = LAYERS.map((l) => {
    const b = { ...l, y };
    y += l.h + (l.id === "dermis" ? 22 : 0);
    return b;
  });
  const H = y + 10;

  return (
    <section>
      <Reveal className="max-w-2xl">
        <p className="rl-eyebrow">How it works</p>
        <h2 className="mt-3 text-4xl leading-[1.05] md:text-5xl">
          Where each product <em className="italic text-highlight">works.</em>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Tap a layer to see which of your products works there.</p>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        {/* Cross-section */}
        <div className="overflow-hidden rounded-[28px] bg-white p-3 ring-1 ring-border md:p-5">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="group" aria-label="Skin layers">
            {/* light from above */}
            <defs>
              <linearGradient id="rs-air" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#FBF3EE" />
              </linearGradient>
            </defs>
            <rect width={W} height="30" fill="url(#rs-air)" />
            {bands.map((b, k) => {
              const on = b.id === sel;
              const count = mine(b).length;
              return (
                <g
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${b.name}, ${b.detail}`}
                  onClick={() => setSel(b.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(b.id)}
                  className="cursor-pointer outline-none"
                >
                  {b.id === "within" && (
                    <text x={W / 2} y={b.y - 8} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.2" fill="#8A8384" fontFamily="Figtree, sans-serif">
                      BLOOD VESSELS CARRY NUTRIENTS FROM YOUR DIET
                    </text>
                  )}
                  <rect x="0" y={b.y} width={W} height={b.h} fill={b.fill} />
                  {/* texture per layer */}
                  {b.id === "surface" &&
                    Array.from({ length: 3 }).map((_, r) =>
                      Array.from({ length: 12 }).map((__, c) => (
                        <rect key={`${r}-${c}`} x={c * 46 + (r % 2 ? 23 : 0) - 10} y={b.y + 5 + r * 13} width="42" height="9" rx="3" fill="#FCEFE7" opacity="0.9" />
                      )),
                    )}
                  {b.id === "epidermis" &&
                    Array.from({ length: 3 }).map((_, r) =>
                      Array.from({ length: 13 }).map((__, c) => (
                        <circle key={`${r}-${c}`} cx={c * 42 + (r % 2 ? 21 : 6)} cy={b.y + 13 + r * 22} r={9 + ((r + c) % 3)} fill="#F6DDD1" stroke="#E7B9A6" strokeWidth="1" />
                      )),
                    )}
                  {b.id === "dermis" &&
                    Array.from({ length: 5 }).map((_, r) => (
                      <path key={r} d={`M0 ${b.y + 14 + r * 19} C 90 ${b.y + 2 + r * 19}, 170 ${b.y + 28 + r * 19}, 260 ${b.y + 14 + r * 19} S 430 ${b.y + 2 + r * 19}, ${W} ${b.y + 16 + r * 19}`} fill="none" stroke="#D38D76" strokeWidth="2" opacity="0.55" />
                    ))}
                  {b.id === "within" && (
                    <path d={`M0 ${b.y + b.h / 2} C 120 ${b.y + 10}, 240 ${b.y + b.h - 10}, 360 ${b.y + b.h / 2} S 480 ${b.y + 14}, ${W} ${b.y + b.h / 2}`} fill="none" stroke="#8FA076" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                  )}
                  {/* selection */}
                  <motion.rect
                    x="1.5"
                    y={b.y + 1.5}
                    width={W - 3}
                    height={b.h - 3}
                    rx="6"
                    fill="none"
                    stroke="#231F20"
                    strokeWidth="3"
                    initial={false}
                    animate={{ opacity: on ? 1 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.3 }}
                  />
                  <rect x="10" y={b.y + b.h / 2 - 15} width="112" height="30" rx="15" fill={on ? "#231F20" : "#FFFFFF"} opacity={on ? 1 : 0.92} />
                  <text x="24" y={b.y + b.h / 2 + 5.5} fontSize="15" fontWeight="700" fill={on ? "#FFFFFF" : "#231F20"} fontFamily="Figtree, sans-serif">
                    {b.name}
                  </text>
                  {count > 0 && (
                    <g>
                      <circle cx={W - 24} cy={b.y + b.h / 2} r="13" fill="#F0C020" />
                      <text x={W - 24} y={b.y + b.h / 2 + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#231F20" fontFamily="Figtree, sans-serif">
                        {count}
                      </text>
                    </g>
                  )}
                  {/* travelling particle on the selected layer */}
                  {on && !reduce && (
                    <motion.circle
                      r="5"
                      fill="#F0C020"
                      stroke="#231F20"
                      strokeWidth="1.5"
                      initial={{ cx: 150, cy: b.id === "within" ? b.y + b.h - 8 : 18 }}
                      animate={{ cx: [150, 250, 350], cy: b.id === "within" ? [b.y + b.h - 8, b.y + b.h / 2, b.y + 10] : [18, b.y + b.h / 2, b.y + b.h / 2] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </g>
              );
            })}
            <text x={W - 8} y="20" textAnchor="end" fontSize="10" fontWeight="700" letterSpacing="1" fill="#8A8384" fontFamily="Figtree, sans-serif">
              NOT TO SCALE
            </text>
          </svg>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Skin layers">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={l.id === sel}
                onClick={() => setSel(l.id)}
                className={`rounded-2xl px-3 py-2 text-left transition-colors ${l.id === sel ? "bg-ink text-white" : "bg-surface hover:bg-border/60"}`}
              >
                <span className="block text-[13px] font-semibold">{l.name}</span>
                <span className="block text-[11px] opacity-70">{l.depth}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={sel}
            initial={reduce ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="rounded-[28px] bg-surface p-6 md:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-highlight">
              {layer.depth} · {layer.detail}
            </p>
            <h3 className="mt-1 text-[2.2rem] leading-tight">{layer.name}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{layer.about}</p>
            <ul className="mt-5 space-y-3">
              {mine(layer).length === 0 && (
                <li className="rounded-2xl bg-white px-4 py-3 text-[13.5px] text-muted-foreground">
                  None of the products in your routine works at this layer.
                </li>
              )}
              {mine(layer).map((id, n) => (
                <motion.li
                  key={id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + n * 0.08, ease: EASE }}
                  className="flex gap-4 rounded-2xl bg-white p-3"
                >
                  <span className="w-16 shrink-0">
                    <ProductTile id={id} rounded="rounded-[12px]" sizes="64px" />
                  </span>
                  <span>
                    <span className="block font-display text-[1.35rem] leading-tight">{PRODUCTS[id].shortName}</span>
                    <span className="mt-1 block text-[13.5px] leading-snug text-muted-foreground">{layer.works[id]}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ── The science behind each step ────────────────────────────────────────── */

function Stories({ ids }: { ids: ProductId[] }) {
  const list = STORIES.filter((s) => ids.includes(s.id));
  return (
    <section>
      <Reveal className="max-w-2xl">
        <p className="rl-eyebrow">The science behind your routine</p>
        <h2 className="mt-3 text-4xl leading-[1.05] md:text-5xl">
          How each step <em className="italic text-highlight">does its job.</em>
        </h2>
      </Reveal>
      <div className="mt-8 space-y-6">
        {list.map((s) => {
          const p = PRODUCTS[s.id];
          return (
            <Reveal key={s.id}>
              <article className="overflow-hidden rounded-[28px] bg-white ring-1 ring-border">
                {ILLUSTRATION[s.id] && (
                  <figure className="relative">
                    <div className="relative aspect-[3/2] overflow-hidden bg-[#F7EEEA] md:aspect-[2/1]">
                      <img
                        src={ILLUSTRATION[s.id]!.src}
                        alt={ILLUSTRATION[s.id]!.caption}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
                      <span className="absolute right-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-heading backdrop-blur">
                        Illustration
                      </span>
                      <div className="absolute bottom-5 left-5 right-5 md:bottom-7 md:left-8">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-yellow">{p.shortName}</p>
                        <h3 className="mt-1 max-w-xl text-[2rem] leading-[1.05] !text-white md:text-[2.8rem]">{s.title}</h3>
                      </div>
                    </div>
                    <figcaption className="px-6 pt-3 text-[11.5px] italic text-muted-foreground md:px-8">
                      {ILLUSTRATION[s.id]!.caption}
                    </figcaption>
                  </figure>
                )}
                <div className="grid md:grid-cols-[280px_1fr]">
                  <div className="relative m-4 min-h-[220px] overflow-hidden rounded-[22px] md:m-6 md:mr-0">
                    <StorePhoto
                      file={p.lifestyle ?? p.photo}
                      alt={p.name}
                      tone={p.photoTone}
                      sizes="280px"
                      widths={[480, 768]}
                      className="absolute inset-0"
                    />
                    <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/92 px-3.5 py-2.5 shadow-lg backdrop-blur">
                      <p className="font-display text-3xl leading-none">{s.stat.value}</p>
                      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{s.stat.label}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center px-6 pb-7 pt-2 md:p-8">
                    {!ILLUSTRATION[s.id] && (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-highlight">{p.shortName}</p>
                        <h3 className="mt-2 mb-1 text-[2.1rem] leading-[1.05] md:text-[2.5rem]">{s.title}</h3>
                      </>
                    )}
                    {s.body.map((t) => (
                      <p key={t} className="mt-3 text-[14.5px] leading-relaxed text-foreground/85">
                        {t}
                      </p>
                    ))}
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-1 self-start text-sm font-semibold text-ink underline decoration-ink/20 underline-offset-[6px] hover:decoration-ink"
                    >
                      View {p.shortName} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
