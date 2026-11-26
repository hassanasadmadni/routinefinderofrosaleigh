import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header, Footer } from "@/components/rl/Chrome";
import { Landing } from "@/components/rl/Landing";
import { PhotoUpload } from "@/components/rl/PhotoUpload";
import { Quiz } from "@/components/rl/Quiz";
import { Results } from "@/components/rl/Results";
import { AnalysisLoader } from "@/components/rl/Viz";
import { ScanOverlay, type ScanPhoto } from "@/components/rl/SkinScan";
import { RoutineChoice } from "@/components/rl/RoutineChoice";
import type { ProductId } from "@/data/catalogue";
import {
  analyzeSkin,
  customiseRoutine,
  clearResult,
  loadResult,
  saveResult,
  type SkinResult,
} from "@/lib/analysis";

import type { QuizAnswers } from "@/data/quiz";
import type { PhotoReadings } from "@/lib/skin-scan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skin Analysis | Rosaleigh Cosmetics" },
      {
        name: "description",
        content:
          "Scan your skin with a selfie or take a two-minute quiz for a personalised morning and evening Rosaleigh routine, with a 30-day plan.",
      },
      { property: "og:title", content: "Skin Analysis | Rosaleigh Cosmetics" },
      {
        property: "og:description",
        content:
          "Scan your skin and get your personalised Rosaleigh routine. Your photo never leaves your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkinAnalysisPage,
});

type Stage = "landing" | "photo" | "quiz" | "analysing" | "choose" | "results";
type Picks = { am: ProductId[]; pm: ProductId[] };

function SkinAnalysisPage() {
  const [stage, setStage] = useState<Stage>("landing");
  // The scanned photo stays in memory for this visit only; it is never saved.
  const [photo, setPhoto] = useState<ScanPhoto | null>(null);
  const [result, setResult] = useState<SkinResult | null>(null);
  const [returning, setReturning] = useState(false);
  // The recommended routine, kept so the customer can choose it or build their own.
  const [recommended, setRecommended] = useState<SkinResult | null>(null);
  const [builder, setBuilder] = useState<{ start: boolean; picks?: Picks }>({ start: false });

  useEffect(() => {
    // Arriving from the QR code: go straight to the selfie scan.
    const params = new URLSearchParams(window.location.search);
    if (params.get("start") === "scan") {
      window.history.replaceState(null, "", window.location.pathname);
      setStage("photo");
      return;
    }
    const saved = loadResult();
    if (saved) {
      setResult(saved);
      setReturning(true);
      setStage("results");
    }
  }, []);

  // Each new step starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  const start = (path: "photo" | "quiz") => {
    const saved = loadResult();
    if (saved) {
      // Repeat visit: never recompute, show the stored routine instantly.
      setResult(saved);
      setReturning(true);
      setStage("results");
      return;
    }
    setStage(path === "photo" ? "photo" : "quiz");
  };

  const complete = (answers: QuizAnswers) => {
    setPhoto(null);
    setStage("analysing");
    setTimeout(() => {
      setRecommended(analyzeSkin({ answers, source: "quiz" }));
      setBuilder({ start: false });
      setStage("choose");
    }, 3200);
  };

  const completeFromPhoto = (answers: QuizAnswers, readings: PhotoReadings | null, scanned: ScanPhoto | null) => {
    setPhoto(scanned);
    setStage("analysing");
    setTimeout(() => {
      setRecommended(analyzeSkin({ answers, source: "photo", readings: readings ?? undefined }));
      setBuilder({ start: false });
      setStage("choose");
    }, 3200);
  };

  const finish = (r: SkinResult) => {
    saveResult(r);
    setResult(r);
    setReturning(false);
    setStage("results");
  };

  const editSteps = () => {
    if (!result) return;
    // A returning visitor has no recommendation in memory: rebuild it (same answers, same result).
    const base =
      recommended ??
      analyzeSkin({ answers: result.answers, source: result.source, readings: result.readings });
    setRecommended(base);
    setBuilder({ start: true, picks: { am: result.am.map((s) => s.productId), pm: result.pm.map((s) => s.productId) } });
    setStage("choose");
  };

  const restart = () => {
    clearResult();
    setResult(null);
    setReturning(false);
    if (photo?.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setRecommended(null);
    setStage("landing");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        {stage === "landing" && <Landing onChoose={start} />}
        {stage === "photo" && (
          <PhotoUpload onBack={() => setStage("landing")} onComplete={completeFromPhoto} />
        )}
        {stage === "quiz" && (
          <Quiz intro={undefined} onExit={() => setStage("landing")} onComplete={complete} />
        )}

        {stage === "analysing" && <AnalysingScreen photo={photo} />}
        {stage === "choose" && recommended && (
          <RoutineChoice
            recommended={recommended}
            photo={photo}
            startInBuilder={builder.start}
            initialPicks={builder.picks}
            onRecommended={() => finish(recommended)}
            onCustom={(picks) => finish(customiseRoutine(recommended, picks))}
          />
        )}

        {stage === "results" && result && (
          <Results result={result} returning={returning} onRestart={restart} onEditSteps={editSteps} photo={photo} />
        )}
      </main>
      <Footer />
    </div>
  );
}

const QUIZ_ANALYSIS_STEPS = [
  "Reading your answers",
  "Building your skin profile",
  "Scoring five skin dimensions",
  "Matching Rosaleigh products",
  "Writing your 30-day plan",
];

const PHOTO_ANALYSIS_STEPS = [
  "Reading your scan",
  "Combining it with your answers",
  "Matching Rosaleigh products",
  "Ordering your morning and evening steps",
  "Writing your 30-day plan",
];

function AnalysingScreen({ photo }: { photo: ScanPhoto | null }) {
  if (photo) {
    return (
      <AnalysisLoader
        media={
          <div className="flex justify-center bg-[#141016] [&_svg]:max-h-[70vh]">
            <ScanOverlay imageUrl={photo.url} w={photo.w} h={photo.h} phase="confirm" scan={photo.scan} shown={4} />
          </div>
        }
        title={
          <>
            Building <em className="italic">your routine…</em>
          </>
        }
        subtitle="We're combining your scan with your three answers to build your personal Rosaleigh routine."
        steps={PHOTO_ANALYSIS_STEPS}
        stepMs={620}
      />
    );
  }
  return (
    <AnalysisLoader
      title={
        <>
          Building <em className="italic">your routine…</em>
        </>
      }
      subtitle="This takes a few seconds. We're turning your answers into a personal Rosaleigh routine."
      steps={QUIZ_ANALYSIS_STEPS}
      stepMs={620}
    />
  );
}
