// How to use each product — taken from the "How to Use" sections on
// rosaleigh.co.uk product pages. Edit here if the store directions change.
import type { ProductId } from "./catalogue";

export interface ProductGuide {
  /** Amount per use, in the store's words */
  quantity: string;
  /** Approximate hands-on time in minutes (used for the time chart) */
  minutes: number;
  /** Ordered directions */
  steps: string[];
  /** Time to leave before the next step, if any */
  wait?: string;
  tip: string;
  caution: string;
  benefits: string;
}

export const PRODUCT_GUIDE: Record<ProductId, ProductGuide> = {
  "face-wash": {
    quantity: "A small amount",
    minutes: 1,
    steps: [
      "Wet your face with lukewarm water.",
      "Dispense a small amount onto your palm and work it into a lather.",
      "Massage over your face in circular motions, avoiding the eye area.",
      "Rinse thoroughly and dry gently with a soft towel.",
    ],
    tip: "Oily skin: focus on the T-zone. Normal to dry skin: cleanse all over.",
    caution: "Avoid the eye area.",
    benefits: "Clears away sweat, oil and daily grime without leaving skin tight.",
  },
  strips: {
    quantity: "1 strip",
    minutes: 1,
    steps: [
      "Place one strip under your tongue.",
      "Let it dissolve completely. No water is needed.",
      "Take it at the same time each day, for example with your morning routine.",
    ],
    tip: "Keep the pack closed between uses and store it somewhere cool and dry.",
    caution:
      "Food supplement for adults. Do not exceed one strip a day. Not a substitute for a varied, balanced diet and a healthy lifestyle. Keep out of reach of young children. If you are pregnant, breastfeeding or taking medication, speak to your doctor before use.",
    benefits:
      "Biotin contributes to the maintenance of normal skin. Niacin and vitamin B12 contribute to normal energy-yielding metabolism.",
  },
  "day-cream": {
    quantity: "Two finger-lengths",
    minutes: 4,
    steps: [
      "Cleanse with Turmeric Face Wash and pat dry.",
      "Dispense about two finger-lengths onto your fingertips. Using less reduces protection.",
      "Massage onto face and neck in upward, circular motions.",
      "Allow 2–3 minutes to absorb.",
    ],
    wait: "2–3 min",
    tip: "Don't forget your ears, hairline and the back of your neck. Reapply after swimming, sweating or towel drying.",
    caution: "Always the last step of your morning routine. Use daily, even on cloudy days.",
    benefits:
      "High UVA and UVB protection with AGEN™, Niacinamide, Tranexamic Acid and Hyaluronic Acid to help skin look firmer and more even.",
  },
  cleanser: {
    quantity: "A cherry-sized scoop",
    minutes: 2,
    steps: [
      "With dry hands, scoop a cherry-sized amount.",
      "Massage onto a dry face for about a minute to melt make-up, SPF and build-up.",
      "Add a little warm water and keep massaging until it turns milky.",
      "Rinse thoroughly with warm water.",
    ],
    tip: "Warm the balm between your fingertips first so it melts easily. Wearing waterproof make-up? Massage a little longer.",
    caution: "Avoid the eye area.",
    benefits: "Melts away make-up, SPF and daily build-up, ready for your second cleanse.",
  },
  "night-cream": {
    quantity: "A pea-sized amount",
    minutes: 1,
    steps: [
      "After your double cleanse, pat skin dry.",
      "Dispense a pea-sized amount onto your fingertips.",
      "Massage onto face and neck in upward, circular motions, avoiding the immediate eye area.",
      "Let it absorb fully before lying down.",
    ],
    tip: "Make it a nightly habit, as the last step of your evening routine.",
    caution: "Avoid the immediate eye area.",
    benefits:
      "AGEN™, NMN and PDRN help skin look firmer and more youthful; soluble collagen and peptides add hydration.",
  },
};
