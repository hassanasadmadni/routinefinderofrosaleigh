// "The science": what each key ingredient is, what it does in the formula,
// where on the skin it works, and why the steps go in this order.
// Wording is cosmetic (how skin looks and feels). The strips are a food
// supplement, so only their authorised nutrition claims are used.
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Droplets, Moon, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { PRODUCTS, type ProductId } from "@/data/catalogue";
import { Reveal } from "./Brand";

const EASE = [0.22, 1, 0.36, 1] as const;

type Zone = "surface" | "pore" | "barrier" | "within";

interface Ingredient {
  name: string;
  what: string;
  does: string;
  zone: Zone;
  in: ProductId[];
}

interface Group {
  key: string;
  label: string;
  icon: typeof Sun;
  intro: string;
  items: Ingredient[];
}

const GROUPS: Group[] = [
  {
    key: "cleanse",
    label: "Cleanse",
    icon: Droplets,
    intro: "Two cleansers that work differently: an oil balm for what water can't shift, then a mousse for what's left.",
    items: [
      {
        name: "Grass-fed Tallow",
        what: "A rich fat whose fatty acids are similar to the lipids in skin.",
        does: "Oil dissolves oil: it melts make-up, SPF and sebum so they lift away, while leaving skin feeling soft.",
        zone: "surface",
        in: ["cleanser"],
      },
      {
        name: "Jojoba Oil",
        what: "A liquid plant wax, close in make-up to skin's own sebum.",
        does: "Helps the balm glide and dissolve build-up, and softens skin as you massage.",
        zone: "surface",
        in: ["cleanser"],
      },
      {
        name: "Charcoal",
        what: "A very porous powder with a huge surface area.",
        does: "Holds on to oil and grime so they rinse away with the balm.",
        zone: "surface",
        in: ["cleanser"],
      },
      {
        name: "Salicylic Acid",
        what: "A beta hydroxy acid (BHA). Unlike most acids it dissolves in oil.",
        does: "Because it mixes with oil, it can work inside pores to help keep them clear, which is why oily T-zones benefit most.",
        zone: "pore",
        in: ["face-wash"],
      },
      {
        name: "Turmeric",
        what: "A golden root extract, used in beauty rituals for centuries.",
        does: "An antioxidant ingredient that helps skin look brighter and more radiant.",
        zone: "surface",
        in: ["face-wash"],
      },
      {
        name: "Ceramides",
        what: "Lipids that make up around half of the fats in skin's outer barrier.",
        does: "Help skin hold on to moisture so it doesn't feel tight after cleansing.",
        zone: "barrier",
        in: ["face-wash"],
      },
    ],
  },
  {
    key: "protect",
    label: "Protect",
    icon: Sun,
    intro: "Daily sun protection is one of the most effective ways to keep skin looking younger. Everything else in the day cream builds on it.",
    items: [
      {
        name: "SPF50 (UVA + UVB)",
        what: "UV filters. UVB causes burning; UVA reaches deeper and adds to visible ageing.",
        does: "SPF50 filters about 98% of UVB, with high UVA protection too. Two finger-lengths is roughly the amount SPF is tested at, so using less gives less protection.",
        zone: "surface",
        in: ["day-cream"],
      },
      {
        name: "Niacinamide",
        what: "A form of vitamin B3, one of the best-studied skincare ingredients.",
        does: "Helps skin tone look more even and supports the skin barrier. Well tolerated by most skin types.",
        zone: "barrier",
        in: ["day-cream"],
      },
      {
        name: "Tranexamic Acid",
        what: "A small, gentle molecule used in tone-correcting skincare.",
        does: "Helps reduce the look of dark spots and uneven tone, working alongside SPF.",
        zone: "barrier",
        in: ["day-cream"],
      },
      {
        name: "Hyaluronic Acid",
        what: "A moisture-binding molecule found naturally in skin.",
        does: "Draws in and holds water at the surface, so skin looks plumper and feels hydrated.",
        zone: "surface",
        in: ["day-cream"],
      },
      {
        name: "AGEN™",
        what: "A specialist anti-ageing active used in both Rosaleigh creams.",
        does: "In these formulas it helps skin look firmer and more youthful, by day and overnight.",
        zone: "barrier",
        in: ["day-cream", "night-cream"],
      },
    ],
  },
  {
    key: "overnight",
    label: "Overnight",
    icon: Moon,
    intro: "On clean skin with no SPF or make-up on top, the night cream has hours to absorb while you sleep.",
    items: [
      {
        name: "NMN",
        what: "Nicotinamide mononucleotide, a molecule related to vitamin B3.",
        does: "An emerging longevity-skincare active. In the night cream it helps skin look firmer and more youthful.",
        zone: "barrier",
        in: ["night-cream"],
      },
      {
        name: "PDRN (Sodium DNA)",
        what: "Polydeoxyribonucleotide: purified DNA fragments, popular in Korean skincare.",
        does: "Helps skin look smoother, more resilient and more youthful.",
        zone: "barrier",
        in: ["night-cream"],
      },
      {
        name: "Peptides",
        what: "Short chains of amino acids, the building blocks of skin's proteins.",
        does: "Help skin feel smoother and look firmer with regular use.",
        zone: "barrier",
        in: ["night-cream"],
      },
      {
        name: "Soluble Collagen",
        what: "A moisturising protein that forms a light film on skin.",
        does: "Holds moisture at the surface so skin feels soft and supple by morning. It moisturises; it doesn't add collagen to your skin.",
        zone: "surface",
        in: ["night-cream"],
      },
    ],
  },
  {
    key: "within",
    label: "Inside-out",
    icon: Sparkles,
    intro: "The strips are a food supplement, not a skincare product. They work from within, like the rest of your diet.",
    items: [
      {
        name: "Biotin",
        what: "Vitamin B7.",
        does: "Biotin contributes to the maintenance of normal skin.",
        zone: "within",
        in: ["strips"],
      },
      {
        name: "Vitamin B12",
        what: "Cobalamin, an essential B vitamin.",
        does: "Vitamin B12 contributes to normal energy-yielding metabolism.",
        zone: "within",
        in: ["strips"],
      },
      {
        name: "Niacin (as Niacinamide)",
        what: "Vitamin B3.",
        does: "Niacin contributes to normal energy-yielding metabolism.",
        zone: "within",
        in: ["strips"],
      },
      {
        name: "Ergothioneine & Nicotinamide Riboside",
        what: "An amino acid found in mushrooms, and a form of vitamin B3.",
        does: "Included in the formula. No health claims are made for them.",
        zone: "within",
        in: ["strips"],
      },
    ],
  },
];

const ZONE_LABEL: Record<Zone, string> = {
  surface: "On the skin's surface",
  pore: "Inside the pores",
  barrier: "In the outer layers",
  within: "From within, through your diet",
};

const ORDER = [
  {
    icon: Droplets,
    when: "Evening",
    title: "Oil before water",
    body: "Make-up, SPF and sebum are oily, and oil dissolves oil. The balm lifts them first, then the face wash clears what's left.",
  },
  {
    icon: Sparkles,
    when: "Morning & evening",
    title: "Clean skin first",
    body: "Cleansing removes oil and grime so what you apply next sits evenly on skin instead of on yesterday's build-up.",
  },
  {
    icon: ShieldCheck,
    when: "Morning",
    title: "SPF goes on last",
    body: "Sunscreen needs an even, unbroken film to protect. Anything layered on top can thin it out, so it's always the final step.",
  },
  {
    icon: Moon,
    when: "Evening",
    title: "Night cream ends the day",
    body: "Applied to double-cleansed skin with nothing on top, it has the whole night to absorb before you wash your face again.",
  },
];

export function Science({ products, embedded = false }: { products?: ProductId[]; embedded?: boolean } = {}) {
  const reduce = useReducedMotion();
  const [g, setG] = useState(0);
  const [sel, setSel] = useState(0);
  // In the results, only the ingredients of the products in this person's routine.
  const groups = products
    ? GROUPS.map((x) => ({ ...x, items: x.items.filter((it) => it.in.some((id) => products.includes(id))) })).filter(
        (x) => x.items.length > 0,
      )
    : GROUPS;
  const group = groups[Math.min(g, groups.length - 1)]!;
  const item = group.items[Math.min(sel, group.items.length - 1)]!;

  return (
    <section
      aria-labelledby="science-title"
      className={embedded ? "" : "mx-auto mt-24 max-w-[1300px] px-4 md:mt-32 md:px-7"}
    >
      <div className={`overflow-hidden rounded-[32px] bg-surface ${embedded ? "px-5 py-10 md:px-10 md:py-12" : "px-5 py-12 md:px-14 md:py-16"}`}>
        <Reveal className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="rl-eyebrow">The science</p>
            <h2 id="science-title" className={`mt-3 leading-[1.02] ${embedded ? "text-4xl md:text-5xl" : "text-[2.6rem] md:text-6xl"}`}>
              {embedded ? (
                <>
                  Why your routine <em className="italic text-highlight">works.</em>
                </>
              ) : (
                <>
                  What's in each step, <em className="italic text-highlight">and why it works.</em>
                </>
              )}
            </h2>
          </div>
          <p className="max-w-md text-[14.5px] leading-relaxed text-muted-foreground md:justify-self-end">
            Every key ingredient in your routine: what it is, what it does in the formula and where on your skin it works.
            Tap an ingredient to see it on the diagram.
          </p>
        </Reveal>

        {/* Group tabs */}
        <div role="tablist" aria-label="Ingredient groups" className="mt-10 flex flex-wrap gap-2">
          {groups.map((x, k) => {
            const on = k === g;
            return (
              <button
                key={x.key}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => {
                  setG(k);
                  setSel(0);
                }}
                className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                  on ? "text-ink" : "text-muted-foreground hover:text-ink"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="science-tab"
                    className="absolute inset-0 rounded-full bg-accent-yellow"
                    transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
                  />
                )}
                <x.icon className="relative h-4 w-4" />
                <span className="relative">{x.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
          {/* Diagram */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="rounded-[26px] bg-white p-4 ring-1 ring-border md:p-6">
              <SkinDiagram zone={item.zone} reduce={reduce} />
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Where it works</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={item.zone}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="mt-1 font-display text-2xl leading-tight"
                    >
                      {ZONE_LABEL[item.zone]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-[12px] font-semibold">{item.name}</span>
              </div>
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">{group.intro}</p>
          </div>

          {/* Ingredient list */}
          <ul className="space-y-2.5" key={group.key}>
            {group.items.map((x, k) => {
              const on = x === item;
              return (
                <motion.li
                  key={x.name}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: k * 0.05, ease: EASE }}
                >
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setSel(k)}
                    className={`w-full rounded-[22px] p-5 text-left transition-[background-color,box-shadow] duration-300 ${
                      on ? "bg-white shadow-[var(--shadow-soft)] ring-1 ring-border" : "bg-white/50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[1.6rem] leading-tight">{x.name}</h3>
                        <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{x.what}</p>
                      </div>
                      <span
                        aria-hidden="true"
                        className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${on ? "bg-accent-yellow" : "bg-border"}`}
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 text-[14.5px] leading-relaxed text-ink">{x.does}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {x.in.map((id) => (
                              <a
                                key={id}
                                href={PRODUCTS[id].url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-[12px] font-semibold text-heading hover:bg-ink hover:text-white"
                              >
                                In {PRODUCTS[id].shortName} <ArrowUpRight className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>

        {/* Why the order matters */}
        <Reveal className="mt-16 border-t border-border pt-12">
          <h3 className="text-[2.2rem] leading-[1.05] md:text-5xl">
            Why the order <em className="italic text-highlight">matters.</em>
          </h3>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER.map((o, k) => (
              <li key={o.title} className="rounded-[22px] bg-white p-5 ring-1 ring-border">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                    <o.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="font-display text-3xl text-border">0{k + 1}</span>
                </div>
                <p className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-highlight">{o.when}</p>
                <h4 className="mt-1 text-[1.55rem] leading-tight">{o.title}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{o.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-[12px] leading-relaxed text-muted-foreground">
            Skincare descriptions refer to how skin looks and feels. The Radiance+ Sublingual Strips are a food supplement
            and should not replace a varied, balanced diet and a healthy lifestyle. Patch test new skincare and speak to a
            doctor about any skin condition.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Skin cross-section ──────────────────────────────────────────────────── */

const ZONE_Y: Record<Zone, [number, number]> = {
  surface: [62, 112],
  pore: [112, 250],
  barrier: [112, 176],
  within: [250, 330],
};

function SkinDiagram({ zone, reduce }: { zone: Zone; reduce: boolean | null }) {
  const [y0, y1] = ZONE_Y[zone];
  const bricks: { x: number; y: number }[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = -1; c < 9; c++) bricks.push({ x: c * 50 + (r % 2 ? 25 : 0), y: 116 + r * 15 });
  const cells: { x: number; y: number; r: number }[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 10; c++) cells.push({ x: 14 + c * 42 + (r % 2 ? 20 : 0), y: 192 + r * 20, r: 9 + ((c + r) % 3) });

  return (
    <svg viewBox="0 0 420 330" className="block w-full" role="img" aria-label={`Skin cross-section. ${ZONE_LABEL[zone]}.`}>
      <defs>
        <linearGradient id="sci-dermis" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6D9CC" />
          <stop offset="1" stopColor="#EDBBA8" />
        </linearGradient>
        <clipPath id="sci-clip">
          <rect x="0" y="0" width="420" height="330" rx="18" />
        </clipPath>
      </defs>
      <g clipPath="url(#sci-clip)">
        <rect width="420" height="330" fill="#FBF6F2" />
        {/* deeper skin */}
        <rect y="250" width="420" height="80" fill="url(#sci-dermis)" />
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M0 ${272 + k * 18} C 80 ${262 + k * 18}, 140 ${284 + k * 18}, 210 ${272 + k * 18} S 340 ${262 + k * 18}, 420 ${276 + k * 18}`}
            fill="none" stroke="#E3A48F" strokeWidth="1.4" opacity="0.7" />
        ))}
        {/* living epidermis */}
        <rect y="176" width="420" height="74" fill="#F8E6DD" />
        {cells.map((c, k) => (
          <circle key={k} cx={c.x} cy={c.y} r={c.r} fill="#F3D3C4" stroke="#E8BBA8" strokeWidth="1" />
        ))}
        {/* barrier: bricks and mortar */}
        <rect y="112" width="420" height="64" fill="#EFD9CC" />
        {bricks.map((b, k) => (
          <rect key={k} x={b.x + 2} y={b.y} width="46" height="12" rx="4" fill="#F9EDE5" stroke="#E2C2B2" strokeWidth="1" />
        ))}
        {/* pore */}
        <path d="M188 112 C 194 160, 192 200, 200 246 L 220 246 C 228 200, 226 160, 232 112 Z" fill="#FBF6F2" stroke="#E2C2B2" strokeWidth="1.2" />
        <ellipse cx="210" cy="236" rx="16" ry="10" fill="#F2DFA9" opacity="0.9" />
        {/* surface film / droplets */}
        {[60, 130, 300, 360].map((x, k) => (
          <ellipse key={x} cx={x} cy={104 - (k % 2) * 4} rx="14" ry="7" fill="#FFFFFF" stroke="#D8C7BE" strokeWidth="1" />
        ))}

        {/* highlight band */}
        <motion.rect
          fill="#F0C020"
          initial={false}
          animate={{
            x: zone === "pore" ? 180 : 0,
            width: zone === "pore" ? 60 : 420,
            y: y0,
            height: y1 - y0,
            opacity: 0.22,
          }}
          transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
        />
        <motion.rect
          width="4"
          fill="#F0C020"
          initial={false}
          animate={{ x: zone === "pore" ? 180 : 0, y: y0, height: y1 - y0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
        />

        {/* arrow: from within */}
        {zone === "within" && (
          <motion.g initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {[110, 210, 310].map((x) => (
              <path key={x} d={`M${x} 322 L${x} 262 M${x - 7} 270 L${x} 262 L${x + 7} 270`} fill="none" stroke="#9A5A22" strokeWidth="2" strokeLinecap="round" />
            ))}
          </motion.g>
        )}
        {zone === "pore" && !reduce && (
          <motion.circle cx="210" r="5" fill="#9A5A22" initial={{ cy: 108 }} animate={{ cy: [108, 230, 108] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
        )}

        {/* labels */}
        <g fontFamily="Figtree, sans-serif" fontSize="10.5" fontWeight="700" fill="#6F6869" letterSpacing="0.6">
          <text x="14" y="40">SKIN SURFACE</text>
          <text x="14" y="168">BARRIER</text>
          <text x="250" y="244">LIVING CELLS</text>
          <text x="14" y="322">DEEPER SKIN</text>
          <text x="240" y="140">PORE</text>
        </g>
        <line x1="236" y1="137" x2="226" y2="137" stroke="#6F6869" strokeWidth="1" />
      </g>
    </svg>
  );
}
