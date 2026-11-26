// ---------------------------------------------------------------------------
// Rosaleigh Cosmetics — product catalogue for the Routine Finder.
//
// Names, ingredients and descriptions follow the product pages on
// rosaleigh.co.uk. Photography is served from the store's own Shopify CDN,
// resized on request, so it always matches the shop.
// ---------------------------------------------------------------------------
import cleanserImg from "@/assets/product-cleanser.webp";
import dayCreamImg from "@/assets/product-day-cream.webp";
import nightCreamImg from "@/assets/product-night-cream.webp";
import stripsImg from "@/assets/product-strips.webp";

const STORE = "https://rosaleigh.co.uk";
const CDN = "https://cdn.shopify.com/s/files/1/1034/2042/8635/files/";

/** A Rosaleigh store image, resized by Shopify's CDN to the requested width. */
export function storeImage(file: string, width = 900): string {
  return `${CDN}${encodeURIComponent(file)}?width=${width}`;
}

/** Responsive srcSet for a store image. */
export function storeSrcSet(file: string, widths = [480, 768, 1080, 1440]): string {
  return widths.map((w) => `${storeImage(file, w)} ${w}w`).join(", ");
}

/** Brand photography used around the Routine Finder. */
export const BRAND_IMAGES = {
  /** Dark portrait with glowing skin-analysis lines (store's Routine Finder banner). */
  analysis: "V3_-_skin_analysis_hero.webp",
  /** Woman holding the Night Cream on a sky-blue background. */
  wink: "media-generation-rosaleigh-wink-hero-right-edge-0-0d97ccf4-8599-453c-b49a-6076fde0d677.webp",
  /** Warm-lit portrait, eyes closed. */
  warm: "media-generation-rosaleigh-beauty-portrait-4x3-0-80e30d19-1bd2-4ae6-b99e-e63cd1e36b94.webp",
  /** Applying cream under a blue sky. */
  sky: "Untitled-2.jpg",
} as const;

export type ProductId = "face-wash" | "strips" | "day-cream" | "cleanser" | "night-cream";

export interface Product {
  id: ProductId;
  /** Name as sold on rosaleigh.co.uk */
  name: string;
  shortName: string;
  /** What the step does in the routine */
  role: string;
  url: string;
  /** Local cut-out (used in the PDF and as an offline fallback) */
  image: string;
  /** Store product photograph (file name on the Shopify CDN) */
  photo: string;
  /** Store lifestyle photograph, where one exists */
  lifestyle?: string;
  /** Approximate dominant colour of the product photograph, shown while it loads */
  photoTone: string;
  /** When it is used — shown as a pill */
  slot: "Morning" | "Evening" | "Morning & evening" | "Once a day";
  keyIngredients: string[];
  /** Short description in the store's own words */
  description: string;
  /** Background gradient used behind cut-outs and in charts */
  tone: { from: string; to: string };
}

export const PRODUCTS: Record<ProductId, Product> = {
  "face-wash": {
    id: "face-wash",
    name: "Rosaleigh Turmeric Face Wash",
    shortName: "Turmeric Face Wash",
    role: "Daily cleanse",
    url: `${STORE}/products/turmeric-face-wash`,
    image: cleanserImg,
    photo: "WhatsApp_Image_2026-10.28.03_AM.jpg",
    photoTone: "#E9D6E6",
    slot: "Morning & evening",
    keyIngredients: ["Turmeric", "Salicylic Acid", "Ceramides"],
    description:
      "A gentle foaming daily cleanser that clears away sweat, oil and city grime, so skin still feels like itself afterwards.",
    tone: { from: "#F6E7F1", to: "#C9B5DA" },
  },
  strips: {
    id: "strips",
    name: "Rosaleigh Radiance+ Sublingual Strips",
    shortName: "Radiance+ Sublingual Strips",
    role: "Inside-out support",
    url: `${STORE}/products/radiance-plus-sublingual-strips`,
    image: stripsImg,
    photo: "WhatsApp_Image_2026-10-26_11.28.02_AM.jpg",
    lifestyle: "WhatsApp_Image_2026-09-08_at_1.27.48_PM.jpg",
    photoTone: "#D9DEC8",
    slot: "Once a day",
    keyIngredients: ["Ergothioneine", "Niacinamide", "Nicotinamide Riboside", "Biotin", "Vitamin B12"],
    description:
      "A daily food supplement in a fast-dissolving strip. Biotin contributes to the maintenance of normal skin; niacin and vitamin B12 contribute to normal energy-yielding metabolism.",
    tone: { from: "#F1EDD5", to: "#B8C4A1" },
  },
  "day-cream": {
    id: "day-cream",
    name: "Rosaleigh Radiance+ SPF50 Day Cream",
    shortName: "Radiance+ SPF50 Day Cream",
    role: "Protect",
    url: `${STORE}/products/age-defying-sunscreen-spf50`,
    image: dayCreamImg,
    photo: "WhatsApp_Image_2026-10-26_at_12.44.24_PM.jpg",
    lifestyle: "WhatsApp_Image_2026-09-08_at_1.21.06_PM_1.jpg",
    photoTone: "#EDB9A2",
    slot: "Morning",
    keyIngredients: ["SPF50 (UVA + UVB)", "AGEN™", "Niacinamide", "Tranexamic Acid", "Hyaluronic Acid"],
    description:
      "Daily SPF50 for face and neck with high UVA and UVB protection. A lightweight, soft-matte finish that helps skin look firmer and more even, and feel hydrated.",
    tone: { from: "#FBE3D6", to: "#EB9F86" },
  },
  cleanser: {
    id: "cleanser",
    name: "Rosaleigh Cleansing Tallow Balm",
    shortName: "Cleansing Tallow Balm",
    role: "First cleanse",
    url: `${STORE}/products/charcoal-cleansing-balm`,
    image: cleanserImg,
    photo: "WhatsApp_Image_2026-11.28.03_AM.jpg",
    lifestyle: "WhatsApp_Image_2026-09-08_at_1.18.09_PM.jpg",
    photoTone: "#CFE0C9",
    slot: "Evening",
    keyIngredients: ["Grass-fed Tallow", "Charcoal", "Jojoba Oil", "Inulin"],
    description:
      "A solid balm that melts into an oil on warm skin to lift make-up, SPF and daily build-up, then turns milky with water and rinses away.",
    tone: { from: "#E6EFDF", to: "#9DB89A" },
  },
  "night-cream": {
    id: "night-cream",
    name: "Rosaleigh Radiance+ Night Cream",
    shortName: "Radiance+ Night Cream",
    role: "Overnight care",
    url: `${STORE}/products/age-defying-night-cream`,
    image: nightCreamImg,
    photo: "WhatsApp_Image_2026-10-26_at.28.02_AM.jpg",
    lifestyle: "WhatsApp_Image_2026-09-08_at_2.46.37_PM_2.jpg",
    photoTone: "#4C5C9C",
    slot: "Evening",
    keyIngredients: ["AGEN™", "NMN", "PDRN (Sodium DNA)", "Soluble Collagen", "Peptides"],
    description:
      "An overnight moisturiser for face and neck. NMN and PDRN help skin look firmer and more youthful; soluble collagen and peptides leave it soft and supple.",
    tone: { from: "#D9DDF5", to: "#6274BD" },
  },
};

export type BundleId = "complete-routine";

export interface Bundle {
  id: BundleId;
  name: string;
  tagline: string;
  items: ProductId[];
  url: string;
  /** The store's own bundle of three of these products */
  trioUrl: string;
}

export const BUNDLES: Record<BundleId, Bundle> = {
  "complete-routine": {
    id: "complete-routine",
    name: "Your Rosaleigh routine",
    tagline:
      "A double cleanse and Night Cream in the evening; Face Wash, a Radiance+ strip and SPF50 in the morning.",
    items: ["face-wash", "strips", "day-cream", "cleanser", "night-cream"],
    url: `${STORE}/collections/all`,
    trioUrl: `${STORE}/products/inside-out-trio`,
  },
};

/** CSS background for a product's tone gradient. */
export function toneBackground(id: ProductId): string {
  const { from, to } = PRODUCTS[id].tone;
  return `radial-gradient(120% 90% at 30% 15%, ${from} 0%, ${to} 100%)`;
}
