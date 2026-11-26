// Branded, multi-page routine PDF, drawn with jsPDF to match the site:
// cover with summary (and the customer's scan photo when there is one),
// illustrated morning and evening steps, 30-day plan, science and shop links.
import { jsPDF } from "jspdf";
import logoFallback from "@/assets/logo-wordmark.png";
import { DISCLAIMER, STORE_FOOTER_LOGO, STORE_LOGO } from "@/components/rl/Chrome";
import { BUNDLES, PRODUCTS, storeImage, type ProductId } from "@/data/catalogue";
import { PRODUCT_GUIDE } from "@/data/routine-guide";
import { metricsFor, type SkinResult } from "./analysis";
import { buildPlan, routineSteps, type PlanStep } from "./plan";
import { describeReadings } from "./skin-scan";

type RGB = [number, number, number];
const INK: RGB = [35, 31, 32];
const BODY: RGB = [74, 69, 70];
const MUTED: RGB = [120, 113, 114];
const GOLD: RGB = [154, 90, 34];
const YELLOW: RGB = [240, 192, 32];
const CREAM: RGB = [247, 241, 238];
const PEACH: RGB = [251, 239, 230];
const NAVY: RGB = [30, 36, 79];
const LINE: RGB = [231, 223, 218];
const WHITE: RGB = [255, 255, 255];
const GREEN: RGB = [74, 140, 96];

const W = 595.28;
const H = 841.89;
const M = 44;

/** Load an image, centre-crop it to the given aspect and return a JPEG data URL. */
function loadCropped(url: string, aspect: number, maxW = 600, focus?: { x: number; y: number }): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const srcAspect = img.naturalWidth / img.naturalHeight;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;
        if (srcAspect > aspect) sw = sh * aspect;
        else sh = sw / aspect;
        const fx = (focus?.x ?? 0.5) * img.naturalWidth;
        const fy = (focus?.y ?? 0.5) * img.naturalHeight;
        const sx = Math.max(0, Math.min(img.naturalWidth - sw, fx - sw / 2));
        const sy = Math.max(0, Math.min(img.naturalHeight - sh, fy - sh / 2));
        const cw = Math.min(maxW, sw);
        const c = document.createElement("canvas");
        c.width = Math.round(cw);
        c.height = Math.round(cw / aspect);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.86));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function loadLogo(url: string, bg = "#F7F1EE"): Promise<{ data: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, 420 / img.naturalWidth);
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve({ data: c.toDataURL("image/jpeg", 0.9), w: c.width, h: c.height });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export interface PdfPhoto {
  url: string;
  /** Face centre in the photo, 0–1, so the crop keeps the face */
  focus?: { x: number; y: number };
}

export async function downloadRoutinePdf(result: SkinResult, photo?: PdfPhoto | null) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const steps = routineSteps(result);
  const am = steps.filter((s) => s.when === "AM");
  const pm = steps.filter((s) => s.when === "PM");
  const ids = [...new Set(steps.map((s) => s.productId))] as ProductId[];
  const m = metricsFor(result);
  const minutes = steps.reduce((n, s) => n + s.minutes, 0);

  // Images in parallel.
  const [logoImg, footerLogo, scanImg, ...productImgs] = await Promise.all([
    loadLogo(`${STORE_LOGO}?width=600`).then((l) => l ?? loadLogo(logoFallback)),
    loadLogo(`${STORE_FOOTER_LOGO}?width=600`, "#231F20"),
    photo ? loadCropped(photo.url, 4 / 5, 700, photo.focus) : Promise.resolve(null),
    ...ids.map((id) => loadCropped(storeImage(PRODUCTS[id].photo, 400), 1, 360)),
  ]);
  const imgOf = Object.fromEntries(ids.map((id, i) => [id, productImgs[i] ?? null])) as Record<ProductId, string | null>;

  /* ── helpers ── */
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (family: "helvetica" | "times", style: string, size: number) => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  const wrap = (t: string, width: number) => doc.splitTextToSize(t, width) as string[];
  const lh = (size: number) => size * 1.32;
  const textBlock = (t: string, x: number, y: number, width: number, size: number, c: RGB, style = "normal", family: "helvetica" | "times" = "helvetica") => {
    font(family, style, size);
    color(c);
    const lines = wrap(t, width);
    doc.text(lines, x, y);
    return lines.length * lh(size);
  };
  const eyebrow = (t: string, x: number, y: number, c: RGB = GOLD) => {
    font("helvetica", "bold", 7.5);
    color(c);
    doc.setCharSpace(1.4);
    doc.text(t.toUpperCase(), x, y);
    doc.setCharSpace(0);
  };
  const chip = (t: string, x: number, y: number, bg: RGB, fg: RGB) => {
    font("helvetica", "bold", 8);
    const w = doc.getTextWidth(t) + 16;
    fill(bg);
    doc.roundedRect(x, y, w, 17, 8.5, 8.5, "F");
    color(fg);
    doc.text(t, x + 8, y + 11.6);
    return w;
  };
  const productImage = (id: ProductId, x: number, y: number, s: number, bg: RGB = WHITE) => {
    const img = imgOf[id];
    const tone = PRODUCTS[id].photoTone;
    const r = parseInt(tone.slice(1, 3), 16), g = parseInt(tone.slice(3, 5), 16), b = parseInt(tone.slice(5, 7), 16);
    fill([r, g, b]);
    doc.roundedRect(x, y, s, s, 10, 10, "F");
    if (img) doc.addImage(img, "JPEG", x, y, s, s, undefined, "FAST");
    // round the corners by painting the background over them
    stroke(bg);
    doc.setLineWidth(8);
    doc.roundedRect(x - 3, y - 3, s + 6, s + 6, 13, 13, "S");
  };
  const ring = (cx: number, cy: number, r: number, value: number) => {
    doc.setLineCap("round");
    doc.setLineWidth(9);
    stroke([236, 228, 222]);
    doc.circle(cx, cy, r, "S");
    stroke(value >= 70 ? GREEN : GOLD);
    const end = -90 + (360 * Math.max(0, Math.min(100, value))) / 100;
    let prev = { x: cx, y: cy - r };
    for (let a = -90 + 3; a <= end; a += 3) {
      const rad = (a * Math.PI) / 180;
      const p = { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
      doc.line(prev.x, prev.y, p.x, p.y);
      prev = p;
    }
    doc.setLineCap("butt");
    font("times", "normal", 30);
    color(INK);
    doc.text(String(value), cx, cy + 6, { align: "center" });
    font("helvetica", "bold", 6.5);
    color(MUTED);
    doc.text("OUT OF 100", cx, cy + 18, { align: "center" });
  };

  /* ══ Page 1: cover ══════════════════════════════════════════════════ */
  fill(CREAM);
  doc.rect(0, 0, W, H, "F");
  // soft colour washes
  doc.setGState(doc.GState({ opacity: 0.55 }));
  fill([217, 221, 245]);
  doc.circle(W + 40, -30, 260, "F");
  fill([251, 227, 214]);
  doc.circle(-60, H * 0.5, 220, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  if (logoImg) {
    const lw = 132;
    doc.addImage(logoImg.data, "JPEG", M, 38, lw, (lw * logoImg.h) / logoImg.w);
  } else {
    font("times", "bold", 20);
    color(INK);
    doc.text("Rosaleigh", M, 60);
  }
  font("helvetica", "normal", 8.5);
  color(MUTED);
  doc.text(new Date(result.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), W - M, 56, { align: "right" });

  const colW = photo && scanImg ? 290 : W - M * 2;
  let y = 150;
  eyebrow(result.custom ? "Your own Rosaleigh routine" : "Your Rosaleigh routine", M, y);
  y += 34;
  font("times", "normal", 38);
  color(INK);
  const titleA = result.custom ? "Your own routine," : "Your routine is";
  const titleB = result.custom ? "in order." : "ready.";
  const aLines = wrap(`${titleA}`, colW);
  doc.text(aLines, M, y);
  y += aLines.length * 38;
  font("times", "italic", 38);
  color(GOLD);
  doc.text(titleB, M, y);
  y += 26;
  y += textBlock(
    `${am.length} ${am.length === 1 ? "step" : "steps"} each morning, ${pm.length} each evening, about ${minutes} minutes a day. Built for ${m.skinType.toLowerCase()} skin with a focus on ${m.concern.toLowerCase()}.`,
    M,
    y,
    colW,
    10.5,
    BODY,
  );
  y += 14;
  // summary tiles
  const tiles: [string, string][] = [
    ["Skin type", m.skinType],
    ["Focus", m.concern],
    ["Each day", `~${minutes} min`],
  ];
  const tw = (colW - 16) / 3;
  tiles.forEach(([k, v], i) => {
    const x = M + i * (tw + 8);
    fill(WHITE);
    doc.roundedRect(x, y, tw, 48, 12, 12, "F");
    eyebrow(k, x + 11, y + 17, MUTED);
    font("helvetica", "bold", 10);
    color(INK);
    doc.text(wrap(v, tw - 20)[0] ?? v, x + 11, y + 34);
  });
  y += 66;

  // scan photo
  if (photo && scanImg) {
    const pw = W - M - (M + colW + 20);
    const ph = pw * 1.25;
    const px = M + colW + 20;
    const py = 130;
    fill(WHITE);
    doc.roundedRect(px - 5, py - 5, pw + 10, ph + 10, 16, 16, "F");
    doc.addImage(scanImg, "JPEG", px, py, pw, ph, undefined, "FAST");
    fill(WHITE);
    doc.roundedRect(px + 10, py + 10, 74, 17, 8.5, 8.5, "F");
    eyebrow("Your scan", px + 18, py + 21.5, INK);
  }

  // score + readings card
  const cardY = Math.max(y, photo && scanImg ? 130 + (W - M - (M + colW + 20)) * 1.25 + 24 : y);
  const readings = result.readings ? describeReadings(result.readings) : null;
  const cardH = readings ? 196 : 130;
  fill(WHITE);
  doc.roundedRect(M, cardY, W - M * 2, cardH, 18, 18, "F");
  ring(M + 70, cardY + 66, 40, m.score);
  eyebrow("Skin profile score", M + 135, cardY + 34);
  font("times", "normal", 26);
  color(INK);
  doc.text(m.band, M + 135, cardY + 62);
  textBlock(
    readings
      ? "A guide score from your skin type, main concern and sun protection, confirmed after your scan. Not a medical measurement."
      : "A guide score from your answers. Not a medical measurement; it shows where your routine can help most.",
    M + 135,
    cardY + 80,
    W - M * 2 - 160,
    8.5,
    MUTED,
  );
  if (readings) {
    const ry = cardY + 128;
    eyebrow("From your skin scan · measured on your device", M + 22, ry - 6);
    const bw = (W - M * 2 - 44 - 30) / 4;
    readings.forEach((r, i) => {
      const x = M + 22 + i * (bw + 10);
      font("helvetica", "bold", 8.5);
      color(INK);
      doc.text(r.label, x, ry + 12);
      font("times", "italic", 13);
      color(GOLD);
      doc.text(r.verdict, x, ry + 29);
      fill([236, 228, 222]);
      doc.roundedRect(x, ry + 37, bw, 4, 2, 2, "F");
      fill(YELLOW);
      doc.roundedRect(x, ry + 37, Math.max(4, (bw * r.value) / 100), 4, 2, 2, "F");
    });
  }

  // day at a glance
  let gy = cardY + cardH + 26;
  eyebrow("Your day at a glance", M, gy);
  gy += 14;
  const half = (W - M * 2 - 14) / 2;
  ([["Morning", am, PEACH, INK], ["Evening", pm, NAVY, WHITE]] as const).forEach(([label, list, bg, fg], c) => {
    const x = M + c * (half + 14);
    const boxH = 30 + Math.max(1, list.length) * 36;
    fill(bg as RGB);
    doc.roundedRect(x, gy, half, boxH, 16, 16, "F");
    font("helvetica", "bold", 8);
    color(c === 0 ? GOLD : YELLOW);
    doc.setCharSpace(1.2);
    doc.text(label.toUpperCase(), x + 16, gy + 20);
    doc.setCharSpace(0);
    if (list.length === 0) {
      font("helvetica", "normal", 9);
      color(fg as RGB);
      doc.text("No steps chosen", x + 16, gy + 44);
    }
    list.forEach((s, i) => {
      const iy = gy + 28 + i * 36;
      productImage(s.productId, x + 14, iy, 32, bg as RGB);
      font("helvetica", "bold", 6.5);
      color(c === 0 ? MUTED : ([200, 204, 230] as RGB));
      doc.text(`STEP ${i + 1}`, x + 56, iy + 12);
      font("times", "normal", 12);
      color(fg as RGB);
      doc.text(PRODUCTS[s.productId].shortName, x + 56, iy + 26);
    });
  });

  /* ══ Routine pages ══════════════════════════════════════════════════ */
  const cardHeight = (s: PlanStep) => {
    const tx = 120;
    const tw2 = W - M * 2 - tx - 18;
    font("helvetica", "normal", 9);
    let h = 52; // title + chips
    s.steps.forEach((l) => (h += wrap(l, tw2 - 16).length * lh(9) + 3));
    if (s.tip) {
      font("helvetica", "normal", 8.5);
      h += wrap(`For your skin: ${s.tip}`, tw2 - 16).length * lh(8.5) + 18;
    }
    if (s.productId === "strips") {
      font("helvetica", "normal", 7.5);
      h += wrap(s.caution, tw2).length * lh(7.5) + 8;
    }
    return Math.max(h + 26, 124);
  };

  const sectionHeader = (when: "AM" | "PM") => {
    const am_ = when === "AM";
    fill(am_ ? PEACH : NAVY);
    doc.rect(0, 0, W, 132, "F");
    eyebrow(am_ ? "Morning routine" : "Evening routine", M, 52, am_ ? GOLD : YELLOW);
    font("times", "normal", 30);
    color(am_ ? INK : WHITE);
    doc.text(am_ ? "Start the day protected." : "End the day clean and cared for.", M, 88);
    const list = am_ ? am : pm;
    font("helvetica", "normal", 9.5);
    color(am_ ? BODY : ([210, 214, 238] as RGB));
    doc.text(
      `${list.length} ${list.length === 1 ? "step" : "steps"} · about ${list.reduce((n, s) => n + s.minutes, 0)} min`,
      M,
      110,
    );
    return 160;
  };

  for (const when of ["AM", "PM"] as const) {
    const list = when === "AM" ? am : pm;
    if (list.length === 0) continue;
    doc.addPage();
    let cy = sectionHeader(when);
    list.forEach((s, i) => {
      const h = cardHeight(s);
      if (cy + h > H - 76) {
        doc.addPage();
        cy = 50;
      }
      const x = M;
      const cw = W - M * 2;
      fill(WHITE);
      stroke(LINE);
      doc.setLineWidth(0.8);
      doc.roundedRect(x, cy, cw, h, 16, 16, "FD");
      productImage(s.productId, x + 16, cy + 16, 88);
      // step number
      fill(INK);
      doc.circle(x + 18, cy + 18, 10, "F");
      font("helvetica", "bold", 9);
      color(WHITE);
      doc.text(String(i + 1), x + 18, cy + 21.2, { align: "center" });

      const tx = x + 120;
      const tw2 = cw - 120 - 18;
      let ty = cy + 28;
      font("times", "normal", 17);
      color(INK);
      doc.text(s.productName, tx, ty);
      ty += 10;
      let cx2 = tx;
      [s.quantity, s.frequency, s.wait ? `Wait ${s.wait}` : null].filter(Boolean).forEach((c) => {
        cx2 += chip(c as string, cx2, ty, CREAM, INK) + 5;
      });
      ty += 32;
      s.steps.forEach((l, n) => {
        fill(when === "AM" ? INK : NAVY);
        doc.circle(tx + 5, ty - 3, 5, "F");
        font("helvetica", "bold", 6.5);
        color(WHITE);
        doc.text(String(n + 1), tx + 5, ty - 0.8, { align: "center" });
        ty += textBlock(l, tx + 16, ty, tw2 - 16, 9, BODY) + 3;
      });
      if (s.tip) {
        font("helvetica", "normal", 8.5);
        const tl = wrap(`For your skin: ${s.tip}`, tw2 - 16);
        const bh = tl.length * lh(8.5) + 12;
        ty += 2;
        fill([253, 244, 214]);
        doc.roundedRect(tx, ty, tw2, bh, 8, 8, "F");
        color(GOLD);
        font("helvetica", "bold", 8.5);
        doc.text("For your skin: ", tx + 8, ty + 14);
        const lead = doc.getTextWidth("For your skin: ");
        font("helvetica", "normal", 8.5);
        color(INK);
        const rest = wrap(s.tip, tw2 - 16 - lead);
        doc.text(rest[0] ?? "", tx + 8 + lead, ty + 14);
        if (rest.length > 1) doc.text(wrap(rest.slice(1).join(" "), tw2 - 16), tx + 8, ty + 14 + lh(8.5));
        ty += bh + 6;
      }
      if (s.productId === "strips") {
        ty += textBlock(s.caution, tx, ty + 4, tw2, 7.5, MUTED);
      }
      cy += h + 14;
    });
  }

  /* ══ Plan, science and shop ═════════════════════════════════════════ */
  doc.addPage();
  let py2 = 60;
  eyebrow("Your first 30 days", M, py2);
  py2 += 30;
  font("times", "normal", 28);
  color(INK);
  doc.text("Thirty days to make it a habit.", M, py2);
  py2 += 22;
  // calendar
  const cols = 10;
  const gap = 6;
  const cell = (W - M * 2 - gap * (cols - 1)) / cols;
  const cellH = Math.round(cell * 0.9);
  for (let d = 1; d <= 30; d++) {
    const r = Math.floor((d - 1) / cols);
    const c = (d - 1) % cols;
    const x = M + c * (cell + gap);
    const yy = py2 + r * (cellH + gap);
    const phaseFill: RGB = d === 1 ? INK : d <= 7 ? [253, 238, 205] : d <= 21 ? [226, 238, 222] : [222, 226, 247];
    fill(phaseFill);
    doc.roundedRect(x, yy, cell, cellH, 8, 8, "F");
    font("helvetica", "bold", 9);
    color(d === 1 ? WHITE : INK);
    doc.text(String(d), x + 7, yy + 14);
    if (d === 1) {
      font("helvetica", "bold", 5.5);
      color(YELLOW);
      doc.text("PATCH TEST", x + 7, yy + 27);
    } else {
      fill(GOLD);
      doc.circle(x + 9, yy + cellH - 8, 2.4, "F");
      fill(NAVY);
      doc.circle(x + 17, yy + cellH - 8, 2.4, "F");
    }
  }
  py2 += 3 * (cellH + gap) + 10;
  font("helvetica", "normal", 8);
  color(MUTED);
  fill(GOLD);
  doc.circle(M + 3, py2 - 3, 2.4, "F");
  doc.text("Morning", M + 9, py2);
  fill(NAVY);
  doc.circle(M + 55, py2 - 3, 2.4, "F");
  doc.text("Evening", M + 61, py2);
  py2 += 18;
  buildPlan(result).forEach((phase, i) => {
    const bg: RGB = i === 0 ? [253, 238, 205] : i === 1 ? [226, 238, 222] : [222, 226, 247];
    font("helvetica", "normal", 8.5);
    const lines = wrap(phase.note, W - M * 2 - 150);
    const bh = Math.max(46, lines.length * lh(8.5) + 22);
    fill(bg);
    doc.roundedRect(M, py2, W - M * 2, bh, 12, 12, "F");
    font("helvetica", "bold", 9.5);
    color(INK);
    doc.text(phase.title, M + 14, py2 + 20);
    font("helvetica", "normal", 8);
    color(BODY);
    doc.text(phase.subtitle, M + 14, py2 + 33);
    textBlock(phase.note, M + 140, py2 + 18, W - M * 2 - 150, 8.5, BODY);
    py2 += bh + 8;
  });

  // weekly notes, to fill in when printed
  py2 += 14;
  eyebrow("Track how your skin feels", M, py2);
  py2 += 14;
  const left = H - 80 - py2;
  const rows = 4;
  const rowGap = 8;
  const rh = Math.max(44, (left - rowGap * (rows - 1)) / rows);
  for (let w = 0; w < rows && py2 + rh <= H - 74; w++) {
    stroke(LINE);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, py2, W - M * 2, rh, 12, 12, "S");
    font("helvetica", "bold", 9);
    color(INK);
    doc.text(`Week ${w + 1}`, M + 14, py2 + 18);
    font("helvetica", "normal", 7.5);
    color(MUTED);
    doc.text("Notes: how my skin looks and feels", M + 14, py2 + 30);
    stroke([236, 228, 222]);
    doc.setLineWidth(0.6);
    for (let l = py2 + 20; l < py2 + rh - 8; l += 16) doc.line(M + 170, l, W - M - 14, l);
    py2 += rh + rowGap;
  }

  // science highlights + shop: their own page
  doc.addPage();
  py2 = 60;
  eyebrow("The science in your routine", M, py2);
  py2 += 30;
  font("times", "normal", 28);
  color(INK);
  doc.text("What each product brings.", M, py2);
  py2 += 26;
  font("helvetica", "normal", 7.8);
  const rowH = (id: ProductId) => Math.max(42, 36 + wrap(PRODUCT_GUIDE[id].benefits, W - M * 2 - 54).length * lh(7.8));
  const sciH = 30 + ids.reduce((n, id) => n + rowH(id), 0);
  void sciH;
  ids.forEach((id) => {
    const p = PRODUCTS[id];
    productImage(id, M, py2, 40);
    font("times", "normal", 14);
    color(INK);
    doc.text(p.shortName, M + 54, py2 + 12);
    font("helvetica", "normal", 7.8);
    color(GOLD);
    doc.text(p.keyIngredients.join(" · "), M + 54, py2 + 24);
    textBlock(PRODUCT_GUIDE[id].benefits, M + 54, py2 + 35, W - M * 2 - 54, 7.8, MUTED);
    py2 += rowH(id) + 10;
  });

  // shop
  py2 += 8;
  const shopH = 34 + ids.length * 16 + 26;
  if (py2 + shopH > H - 76) {
    doc.addPage();
    py2 = 60;
  }
  fill(INK);
  doc.roundedRect(M, py2, W - M * 2, shopH, 16, 16, "F");
  eyebrow("Shop your routine at rosaleigh.co.uk", M + 18, py2 + 22, YELLOW);
  let sy = py2 + 42;
  ids.forEach((id) => {
    font("helvetica", "normal", 9.5);
    color(WHITE);
    doc.textWithLink(`${PRODUCTS[id].shortName}  ->`, M + 18, sy, { url: PRODUCTS[id].url });
    sy += 16;
  });
  font("helvetica", "bold", 9.5);
  color(YELLOW);
  doc.textWithLink("The Inside-Out Trio bundle  ->", M + 18, sy + 6, { url: BUNDLES[result.bundleId].trioUrl });

  /* ══ Footer on every page: dark band with the store's gold logo ═══════ */
  const pages = doc.getNumberOfPages();
  const FOOT = 62;
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    fill(INK);
    doc.rect(0, H - FOOT, W, FOOT, "F");
    let tx = M;
    if (footerLogo) {
      const lh2 = 22;
      const lw2 = (lh2 * footerLogo.w) / footerLogo.h;
      doc.addImage(footerLogo.data, "JPEG", M, H - FOOT / 2 - lh2 / 2, lw2, lh2);
      tx = M + lw2 + 18;
    } else {
      font("times", "normal", 16);
      color(YELLOW);
      doc.text("Rosaleigh", M, H - FOOT / 2 + 5);
      tx = M + 90;
    }
    font("helvetica", "normal", 6);
    color([200, 194, 195]);
    const disc = wrap(DISCLAIMER, W - tx - M - 70);
    doc.text(disc, tx, H - FOOT / 2 - ((disc.length - 1) * 7.9) / 2 + 2);
    font("helvetica", "bold", 7.5);
    color(YELLOW);
    doc.text("rosaleigh.co.uk", W - M, H - FOOT / 2 - 2, { align: "right" });
    font("helvetica", "normal", 7);
    color([200, 194, 195]);
    doc.text(`${p} / ${pages}`, W - M, H - FOOT / 2 + 9, { align: "right" });
  }

  doc.save("rosaleigh-routine.pdf");
}
