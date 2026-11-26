// ---------------------------------------------------------------------------
// Skin scan — runs entirely in the browser. The photo never leaves the device.
//
// 1. MediaPipe Face Landmarker finds 478 points on the face.
// 2. We sample small patches of skin at known landmarks (forehead, nose,
//    cheeks, chin) and take simple pixel measurements:
//      • Shine      — share of bright, low-saturation (specular) pixels in the T-zone
//      • Redness    — how much red outweighs green on the cheeks
//      • Evenness   — how consistent brightness is across the cheeks and forehead
//      • Smoothness — fine-detail energy (Laplacian) on the cheeks
// These are readings of the photo, not a diagnosis: lighting, camera and
// make-up all affect them, and the UI says so.
// ---------------------------------------------------------------------------

const VISION_VERSION = "0.10.14";
const VISION_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/+esm`;
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export interface Pt {
  x: number; // 0..1 of image width
  y: number; // 0..1 of image height
}

export type ReadingKey = "shine" | "redness" | "evenness" | "smoothness";

export interface Reading {
  key: ReadingKey;
  label: string;
  zone: string;
  value: number; // 0..100
  verdict: string;
  note: string;
}

export interface PhotoReadings {
  shine: number;
  redness: number;
  evenness: number;
  smoothness: number;
}

export interface ScanZone {
  key: ReadingKey;
  label: string;
  /** Centre in normalised image coords */
  at: Pt;
  /** Radius as a fraction of image width */
  r: number;
}

export interface ScanResult {
  landmarks: Pt[];
  /** Pairs of landmark indices forming the face mesh */
  mesh: [number, number][];
  readings: PhotoReadings;
  zones: ScanZone[];
  suggestion: { skinType?: string; concern?: string; sensitiveHint: boolean };
}

// Landmark indices (MediaPipe canonical face mesh)
const L = {
  forehead: [151, 108, 337],
  nose: [4, 195],
  cheekL: [50, 205],
  cheekR: [280, 425],
  chin: [199],
  faceLeft: 234,
  faceRight: 454,
};

type Vision = {
  FaceLandmarker: {
    createFromOptions: (resolver: unknown, options: unknown) => Promise<{
      detect: (img: HTMLImageElement | HTMLCanvasElement) => { faceLandmarks: { x: number; y: number }[][] };
      close: () => void;
    }>;
    FACE_LANDMARKS_TESSELATION: { start: number; end: number }[];
  };
  FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> };
};

let visionPromise: Promise<Vision> | null = null;
function loadVision(): Promise<Vision> {
  visionPromise ??= import(/* @vite-ignore */ VISION_URL) as Promise<Vision>;
  return visionPromise;
}

/** Start downloading the scanner early (e.g. when the photo screen opens). */
export function preloadScanner() {
  void loadVision().catch(() => {
    visionPromise = null;
  });
}

async function detectLandmarks(img: HTMLImageElement) {
  const vision = await loadVision();
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
  const make = (delegate: "GPU" | "CPU") =>
    vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "IMAGE",
      numFaces: 1,
    });
  let landmarker;
  try {
    landmarker = await make("GPU");
  } catch {
    landmarker = await make("CPU");
  }
  const res = landmarker.detect(img);
  landmarker.close();
  const face = res.faceLandmarks[0];
  if (!face || face.length < 400) return null;
  const mesh = vision.FaceLandmarker.FACE_LANDMARKS_TESSELATION.map((c) => [c.start, c.end] as [number, number]);
  return { landmarks: face.map((p) => ({ x: p.x, y: p.y })), mesh };
}

const clamp = (v: number, lo = 5, hi = 95) => Math.max(lo, Math.min(hi, v));

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Run the full scan on a photo (data URL or object URL). */
export async function scanPhoto(src: string): Promise<ScanResult | null> {
  const img = await loadImage(src);
  const found = await detectLandmarks(img);
  if (!found) return null;
  const { landmarks, mesh } = found;

  // Normalise scale: draw so the face is ~320px wide, for comparable texture readings.
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const lp = (i: number) => landmarks[i]!;
  const faceW = Math.abs(lp(L.faceRight).x - lp(L.faceLeft).x) * W || W * 0.4;
  const scale = Math.min(1, 320 / faceW) || 1;
  const cw = Math.max(1, Math.round(W * scale));
  const ch = Math.max(1, Math.round(H * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, cw, ch);
  const { data } = ctx.getImageData(0, 0, cw, ch);

  const faceWpx = faceW * scale;
  const r = Math.max(4, Math.round(faceWpx * 0.06));

  const lum = (i: number) => 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
  const patch = (idx: number[]) => {
    const out: number[] = [];
    for (const k of idx) {
      const cx = Math.round(lp(k).x * cw);
      const cy = Math.round(lp(k).y * ch);
      for (let y = cy - r; y <= cy + r; y++) {
        if (y < 1 || y >= ch - 1) continue;
        for (let x = cx - r; x <= cx + r; x++) {
          if (x < 1 || x >= cw - 1) continue;
          if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
          out.push((y * cw + x) * 4);
        }
      }
    }
    return out;
  };

  const tzone = patch([...L.forehead, ...L.nose]);
  const cheeks = patch([...L.cheekL, ...L.cheekR]);
  const forehead = patch(L.forehead);
  const chin = patch(L.chin);
  const skin = [...cheeks, ...forehead, ...chin];
  if (skin.length < 50) return null;

  // Reference brightness: 90th percentile of skin luminance.
  const skinL = skin.map(lum).sort((a, b) => a - b);
  const p90 = skinL[Math.floor(skinL.length * 0.9)] ?? 200;
  const meanL = skinL.reduce((s, v) => s + v, 0) / skinL.length || 1;

  // Shine: bright & desaturated pixels in the T-zone.
  const specular = (list: number[]) => {
    let n = 0;
    for (const i of list) {
      const R = data[i]!, G = data[i + 1]!, B = data[i + 2]!;
      const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      if (lum(i) >= Math.max(p90, meanL * 1.18) && sat < 0.28) n++;
    }
    return list.length ? n / list.length : 0;
  };
  const tShine = specular(tzone);
  const cheekShine = specular(cheeks);
  const shine = clamp(tShine * 420 + 8);

  // Redness: (R - G) / (R + G + B) on the cheeks, relative to the forehead.
  const redIdx = (list: number[]) =>
    list.reduce((s, i) => s + (data[i]! - data[i + 1]!) / (data[i]! + data[i + 1]! + data[i + 2]! + 1), 0) /
    (list.length || 1);
  const cheekRed = redIdx(cheeks);
  const foreRed = redIdx(forehead);
  const redness = clamp(((cheekRed - 0.06) / 0.14) * 100 + Math.max(0, cheekRed - foreRed) * 250);

  // Evenness: coefficient of variation of brightness within each patch area, averaged.
  const cv = (list: number[]) => {
    if (list.length < 10) return 0;
    const v = list.map(lum);
    const m = v.reduce((s, x) => s + x, 0) / v.length || 1;
    const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
    return sd / m;
  };
  const unevenness = (cv(cheeks) + cv(forehead)) / 2;
  const evenness = clamp(100 - (unevenness - 0.03) * 520);

  // Smoothness: mean absolute Laplacian on the cheeks, normalised by brightness.
  let lap = 0;
  for (const i of cheeks) {
    const c = lum(i);
    const lpx = lum(i - 4) + lum(i + 4) + lum(i - cw * 4) + lum(i + cw * 4) - 4 * c;
    lap += Math.abs(lpx);
  }
  const lapNorm = lap / (cheeks.length || 1) / meanL;
  const smoothness = clamp(100 - ((lapNorm - 0.012) / 0.06) * 100);

  const readings: PhotoReadings = {
    shine: Math.round(shine),
    redness: Math.round(redness),
    evenness: Math.round(evenness),
    smoothness: Math.round(smoothness),
  };

  const avg = (idx: number[]): Pt => ({
    x: idx.reduce((s, k) => s + lp(k).x, 0) / idx.length,
    y: idx.reduce((s, k) => s + lp(k).y, 0) / idx.length,
  });
  const zr = (faceW / W) * 0.11;
  const zones: ScanZone[] = [
    { key: "shine", label: "T-zone", at: avg([151, 4]), r: zr * 1.1 },
    { key: "redness", label: "Cheeks", at: avg(L.cheekL), r: zr },
    { key: "evenness", label: "Tone", at: avg(L.cheekR), r: zr },
    { key: "smoothness", label: "Texture", at: avg(L.chin), r: zr * 0.85 },
  ];

  const highShine = readings.shine >= 60;
  const suggestion: ScanResult["suggestion"] = {
    sensitiveHint: readings.redness >= 65,
  };
  if (highShine) suggestion.skinType = cheekShine * 420 + 8 >= 45 ? "oily" : "combination";
  else if (readings.shine < 25) suggestion.skinType = "normal";
  if (readings.smoothness < 45) suggestion.concern = "texture";
  else if (readings.evenness < 45) suggestion.concern = "dullness";

  return { landmarks, mesh, readings, zones, suggestion };
}

/** Human-readable readings, for the scan screen, results and PDF. */
export function describeReadings(r: PhotoReadings): Reading[] {
  return [
    {
      key: "shine",
      label: "Shine",
      zone: "T-zone",
      value: r.shine,
      verdict: r.shine >= 60 ? "High" : r.shine >= 30 ? "Moderate" : "Low",
      note: "Bright, reflective areas across the forehead and nose.",
    },
    {
      key: "redness",
      label: "Redness",
      zone: "Cheeks",
      value: r.redness,
      verdict: r.redness >= 65 ? "Noticeable" : r.redness >= 35 ? "Some" : "Low",
      note: "How much warmer and redder the cheeks look than the rest of the face.",
    },
    {
      key: "evenness",
      label: "Tone evenness",
      zone: "Cheeks & forehead",
      value: r.evenness,
      verdict: r.evenness >= 70 ? "Even" : r.evenness >= 45 ? "Fairly even" : "Uneven",
      note: "How consistent brightness is across the skin.",
    },
    {
      key: "smoothness",
      label: "Smoothness",
      zone: "Cheeks",
      value: r.smoothness,
      verdict: r.smoothness >= 70 ? "Smooth" : r.smoothness >= 45 ? "Some texture" : "Visible texture",
      note: "Fine surface detail picked up by the camera.",
    },
  ];
}
