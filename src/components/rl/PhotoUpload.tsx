import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Lock, Trash2, ScanFace, ArrowLeft, Loader2, Check, Upload, X } from "lucide-react";
import { checkFace } from "@/lib/face-check";
import { preloadScanner, type PhotoReadings } from "@/lib/skin-scan";
import type { QuizAnswers } from "@/data/quiz";
import { SkinScan, type ScanPhoto } from "./SkinScan";

interface Props {
  onBack: () => void;
  onComplete: (answers: QuizAnswers, readings: PhotoReadings | null, photo: ScanPhoto | null) => void;
}

const ERROR_MESSAGE =
  "We couldn't clearly detect a human face in this photo. Please use a clear, well-lit, front-facing photo with your face fully visible.";


export function PhotoUpload({ onBack, onComplete }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "camera" | "checking" | "scan">("idle");
  const [scanUrl, setScanUrl] = useState<string | null>(null);

  // Start downloading the face-landmark model while the customer chooses a photo.
  useEffect(() => {
    preloadScanner();
  }, []);
  const [dragging, setDragging] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanLine, setScanLine] = useState(0);
  const [captured, setCaptured] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRef = useRef<number | null>(null);

  // Scan line animation
  useEffect(() => {
    if (state !== "camera") return;
    let dir = 1;
    let pos = 0;
    const tick = () => {
      pos += dir * 1.2;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      setScanLine(pos);
      scanRef.current = requestAnimationFrame(tick);
    };
    scanRef.current = requestAnimationFrame(tick);
    return () => { if (scanRef.current) cancelAnimationFrame(scanRef.current); };
  }, [state]);

  // Stop camera stream on unmount or state change
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state !== "camera") stopCamera();
  }, [state, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const openCamera = async () => {
    setCameraError(null);
    setCaptured(null);
    setError(null);
    setState("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access was denied. Please allow camera access in your browser settings, or upload a photo instead.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror the capture to match the preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(dataUrl);
    stopCamera();
  };

  const useCaptured = async () => {
    if (!captured) return;
    setError(null);
    setState("checking");
    // Convert dataUrl to File for face check
    const res = await fetch(captured);
    const blob = await res.blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    const result = await checkFace(file);
    if (!result.ok) {
      setState("idle");
      setCaptured(null);
      setError(ERROR_MESSAGE);
      return;
    }
    setScanUrl(captured);
    setState("scan");
  };

  const retake = () => {
    setCaptured(null);
    void openCamera();
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!/image\/(jpeg|jpg|png|webp)/.test(file.type)) {
      setError(ERROR_MESSAGE);
      return;
    }
    setError(null);
    setState("checking");
    const result = await checkFace(file);
    if (!result.ok) {
      setState("idle");
      setError(ERROR_MESSAGE);
      return;
    }
    setScanUrl(result.dataUrl ?? URL.createObjectURL(file));
    setState("scan");
  };

  // ── SKIN SCAN ──
  if (state === "scan" && scanUrl) {
    return (
      <SkinScan
        imageUrl={scanUrl}
        onBack={() => {
          setScanUrl(null);
          setState("idle");
        }}
        onComplete={onComplete}
      />
    );
  }

  // ── CAMERA SCREEN ──
  if (state === "camera") {
    return (
      <section className="rl-enter mx-auto max-w-2xl px-5 pt-10 md:pt-16">
        <BackLink onClick={() => { stopCamera(); setState("idle"); }} />
        <h1 className="mt-6 text-5xl leading-[1.02] md:text-6xl">Take your <em className="italic">photo.</em></h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Position your face in the frame, in natural light, looking straight ahead.
        </p>

        <div className="mt-6 relative overflow-hidden rounded-2xl bg-black">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
              <X className="h-8 w-8 text-error" />
              <p className="text-sm text-white/70">{cameraError}</p>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="mt-2 rounded-full bg-accent-yellow px-6 py-2.5 text-sm font-semibold text-ink"
              >
                Upload instead
              </button>
            </div>
          ) : captured ? (
            /* ── Captured preview ── */
            <div className="relative">
              <img src={captured} alt="Captured" className="w-full rounded-2xl" style={{ transform: "scaleX(-1)" }} />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 gap-3">
                <p className="text-sm font-medium text-white drop-shadow">Happy with this photo?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={retake}
                    className="rounded-full border border-white/40 bg-black/40 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => void useCaptured()}
                    className="rounded-full bg-accent-yellow px-6 py-2.5 text-sm font-semibold text-ink"
                  >
                    Use this photo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Live camera feed ── */
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-2xl"
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Face guide oval */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 300 400" className="absolute h-[75%] w-auto opacity-60">
                  <ellipse
                    cx="150" cy="200" rx="120" ry="160"
                    fill="none"
                    stroke="#F0C020"
                    strokeWidth="2.5"
                    strokeDasharray="8 5"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;-52" dur="2s" repeatCount="indefinite" />
                  </ellipse>
                </svg>
              </div>

              {/* Scanning line */}
              <div
                className="absolute left-[12%] right-[12%] h-0.5 pointer-events-none"
                style={{
                  top: `${12 + scanLine * 0.76}%`,
                  background: "linear-gradient(90deg, transparent, #D1A875, #F0C020, #D1A875, transparent)",
                  boxShadow: "0 0 10px 2px rgba(240,192,32,0.55)",
                  transition: "top 0.016s linear",
                }}
              />

              {/* Corner brackets */}
              {[
                { top: "8%", left: "8%", rotate: "0deg" },
                { top: "8%", right: "8%", rotate: "90deg" },
                { bottom: "8%", left: "8%", rotate: "270deg" },
                { bottom: "8%", right: "8%", rotate: "180deg" },
              ].map((style, i) => (
                <div
                  key={i}
                  className="absolute h-7 w-7 pointer-events-none"
                  style={{ ...style, transform: `rotate(${style.rotate})` }}
                >
                  <div className="absolute top-0 left-0 h-full w-0.5 bg-accent-yellow rounded" />
                  <div className="absolute top-0 left-0 h-0.5 w-full bg-accent-yellow rounded" />
                </div>
              ))}

              {/* Status badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-white/80">Scanning</span>
              </div>

              {/* Capture button */}
              <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="h-16 w-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-transform active:scale-95 flex items-center justify-center"
                >
                  <div className="h-11 w-11 rounded-full bg-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </section>
    );
  }

  // ── IDLE / UPLOAD SCREEN ──
  return (
    <section className="rl-enter mx-auto max-w-2xl px-5 pt-10 md:pt-16">
      <BackLink onClick={onBack} />
      <h1 className="mt-6 text-5xl leading-[1.02] md:text-6xl">Start with <em className="italic">a selfie.</em></h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Natural daylight, no makeup if possible, and look straight at the camera.
      </p>

      {/* Two options */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {/* Open camera */}
        <button
          type="button"
          onClick={() => void openCamera()}
          className="group flex flex-col items-center gap-3 rounded-[24px] px-6 py-10 text-center text-white transition-transform duration-300 hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #4f87b8 0%, #a9cdeb 100%)" }}
        >
          <div className="relative">
            <Camera className="h-8 w-8 text-white" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent-yellow animate-ping" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent-yellow" />
          </div>
          <p className="font-display text-3xl !text-white">Open camera</p>
          <p className="text-xs text-white/85">Take a photo directly, with a face guide</p>
        </button>

        {/* Upload photo */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-[24px] border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging ? "border-highlight bg-surface" : "border-border bg-surface/60 hover:bg-surface"
          }`}
        >
          {state === "checking" ? (
            <Loader2 className="h-8 w-8 animate-spin text-highlight" />
          ) : (
            <Upload className="h-8 w-8 text-heading" />
          )}
          <p className="font-display text-3xl text-heading">
            {state === "checking" ? "Checking your photo…" : "Upload a photo"}
          </p>
          <p className="text-xs text-muted-foreground">Drag and drop, or tap — JPG, PNG or WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm leading-relaxed text-error">
          {error}
        </p>
      )}

      <ul className="mt-6 flex flex-wrap gap-2.5">
        <Pill icon={<Lock className="h-3.5 w-3.5" />} label="Stays on your device" />
        <Pill icon={<Trash2 className="h-3.5 w-3.5" />} label="Never uploaded" />
        <Pill icon={<ScanFace className="h-3.5 w-3.5" />} label="No facial recognition" />
      </ul>
    </section>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs text-muted-foreground">
      {icon}
      {label}
    </li>
  );
}

export function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-heading"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}