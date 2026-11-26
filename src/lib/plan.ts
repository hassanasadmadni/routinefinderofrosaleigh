import { PRODUCTS, type ProductId } from "@/data/catalogue";
import { PRODUCT_GUIDE } from "@/data/routine-guide";
import type { SkinResult } from "./analysis";

export interface PlanStep {
  productId: ProductId;
  productName: string;
  image: string;
  when: "AM" | "PM";
  quantity: string;
  /** Directions as one sentence block (used in the PDF) */
  how: string;
  steps: string[];
  wait?: string;
  minutes: number;
  frequency: string;
  caution: string;
  benefits: string;
  reason: string;
  tip?: string;
}

export interface PlanPhase {
  id: string;
  title: string;
  subtitle: string;
  note: string;
  steps: PlanStep[];
}

function frequencyFor(productId: ProductId, sensitive: boolean): string {
  switch (productId) {
    case "face-wash":
      return sensitive ? "Every evening" : "Morning and evening";
    case "strips":
      return "One strip a day";
    case "day-cream":
      return "Every morning";
    case "cleanser":
    case "night-cream":
      return "Every evening";
  }
}

export function routineSteps(result: SkinResult): PlanStep[] {
  const sensitive = result.answers.skinType === "sensitive";
  const build = (when: "AM" | "PM") =>
    (when === "AM" ? result.am : result.pm).map((step) => {
      const product = PRODUCTS[step.productId];
      const guide = PRODUCT_GUIDE[step.productId];
      return {
        productId: step.productId,
        productName: product.shortName,
        image: product.image,
        when,
        quantity: guide.quantity,
        how: guide.steps.join(" "),
        steps: guide.steps,
        ...(guide.wait ? { wait: guide.wait } : {}),
        minutes: guide.minutes,
        frequency: frequencyFor(step.productId, sensitive),
        caution: guide.caution,
        benefits: guide.benefits,
        reason: step.reason,
        ...(step.tip ? { tip: step.tip } : {}),
      } satisfies PlanStep;
    });
  return [...build("AM"), ...build("PM")];
}

export function buildPlan(result: SkinResult): PlanPhase[] {
  const steps = routineSteps(result);
  return [
    {
      id: "p1",
      title: "Days 1–7",
      subtitle: "Getting started",
      note: "Patch test each new product on your inner forearm for 24 hours before using it on your face. Then follow your routine in order, morning and evening, at roughly the same times each day.",
      steps,
    },
    {
      id: "p2",
      title: "Days 8–21",
      subtitle: "Building the habit",
      note: "Keep the order and the amounts the same every day. Use the full two finger-lengths of SPF each morning, and finish every evening with your Night Cream.",
      steps,
    },
    {
      id: "p3",
      title: "Days 22–30",
      subtitle: "Your routine",
      note: "By now the routine should feel automatic. Keep going beyond day 30. Consistency is what makes a routine work.",
      steps,
    },
  ];
}
