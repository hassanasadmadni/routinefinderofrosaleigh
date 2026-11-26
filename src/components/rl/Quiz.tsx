import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { QUIZ, type QuizAnswers } from "@/data/quiz";
import { Check } from "lucide-react";
import { BRAND_IMAGES, PRODUCTS } from "@/data/catalogue";
import { StorePhoto } from "./Brand";
import { BackLink } from "./PhotoUpload";

/** A store photograph for each question, in order. */
const QUESTION_PHOTOS: { file: string; tone: string; position: string }[] = [
  { file: BRAND_IMAGES.warm, tone: "#D9B48F", position: "object-[60%_40%]" },
  { file: BRAND_IMAGES.sky, tone: "#7FA9D6", position: "object-[40%_40%]" },
  { file: PRODUCTS.cleanser.lifestyle!, tone: "#CFC3B4", position: "object-center" },
  { file: PRODUCTS["night-cream"].lifestyle!, tone: "#3C4666", position: "object-center" },
  { file: PRODUCTS["day-cream"].lifestyle!, tone: "#E7DCD2", position: "object-center" },
  { file: BRAND_IMAGES.wink, tone: "#A9CDEB", position: "object-[70%_40%]" },
];

interface Props {
  intro?: string | undefined;
  onExit: () => void;
  onComplete: (answers: QuizAnswers) => void;
}

export function Quiz({ intro, onExit, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const question = QUIZ[step]!;
  const progress = ((step + (answers[question.id] ? 1 : 0)) / QUIZ.length) * 100;

  const choose = (value: string) => {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (step === QUIZ.length - 1) {
      onComplete(next as QuizAnswers);
    } else {
      window.setTimeout(() => setStep(step + 1), 300);
    }
  };

  const photo = QUESTION_PHOTOS[step] ?? QUESTION_PHOTOS[0]!;

  return (
    <section className="mx-auto grid max-w-[1200px] gap-10 px-5 pt-8 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:px-7 md:pt-12">
      <div className="max-w-2xl">
      <BackLink onClick={() => (step === 0 ? onExit() : setStep(step - 1))} />

      <div className="mt-6 flex gap-1.5" aria-hidden="true">
        {QUIZ.map((q, n) => (
          <span key={q.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
            <motion.span
              className="block h-full rounded-full bg-gradient-to-r from-honey to-accent-yellow"
              initial={false}
              animate={{ width: n < step || (n === step && answers[q.id]) ? "100%" : n === step ? "35%" : "0%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
        ))}
      </div>
      <p className="rl-eyebrow mt-4" aria-live="polite">
        Question {step + 1} <span className="text-muted-foreground">of {QUIZ.length}</span>
        <span className="sr-only"> — {Math.round(progress)}% complete</span>
      </p>
      {intro && step === 0 && (
        <p className="mt-5 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
          {intro}
        </p>
      )}

      <div key={step} className="rl-enter mt-7">
        <h1 className="text-4xl leading-[1.08] md:text-5xl">{question.title}</h1>
        {question.subtitle && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{question.subtitle}</p>
        )}

        <div className="mt-8 grid gap-3">
          {question.options.map((option, i) => {
            const selected = answers[question.id] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => choose(option.value)}
                style={{ animationDelay: `${i * 45}ms` }}
                className={`rl-enter group flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-[15px] transition-all duration-200 ${
                  selected
                    ? "border-ink bg-accent-yellow/15 font-medium text-heading"
                    : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-ink/40 hover:bg-surface hover:shadow-[var(--shadow-card)]"
                }`}
              >
                <span>{option.label}</span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    selected ? "border-ink bg-accent-yellow" : "border-border bg-white group-hover:border-ink/40"
                  }`}
                >
                  {selected && <Check className="rl-pop h-3.5 w-3.5 text-ink" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      <QuizPhoto photo={photo} step={step} />
    </section>
  );
}

function QuizPhoto({ photo, step }: { photo: (typeof QUESTION_PHOTOS)[number]; step: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative hidden md:block">
      <div className="sticky top-8 aspect-[4/5] overflow-hidden rounded-[2rem] bg-surface">
        <AnimatePresence initial={false}>
          <motion.div
            key={step}
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <StorePhoto file={photo.file} alt="" tone={photo.tone} sizes="40vw" widths={[600, 900]} className="h-full w-full" imgClassName={photo.position} />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-6 pt-20 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-yellow">Rosaleigh Routine Finder</p>
          <p className="mt-1 font-display text-3xl leading-tight">About two minutes. Six questions.</p>
        </div>
      </div>
    </div>
  );
}
