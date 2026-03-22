import { useRef, useEffect } from 'react';

// Seeded PRNG (mulberry32)
function createRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

const MODES = ['truchet', 'diagonal', 'concentric', 'zohreh', 'sili'];

function drawTruchet(ctx, rng, ox, oy, cols, rows, cw, ch, lw, density, p) {
  const colors = [p.strokeColor, p.accentColor, p.highlightColor];

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = ox + i * cw;
      const y = oy + j * ch;
      const rot = Math.floor(rng() * 4);
      const jitter = (rng() * 2 - 1) * p.rotationJitter * 0.2;

      ctx.save();
      ctx.translate(x + cw / 2, y + ch / 2);
      ctx.rotate(rot * Math.PI / 2 + jitter);
      ctx.translate(-cw / 2, -ch / 2);

      const r = rng();
      const col = r < p.primaryWeight ? colors[0] : r < p.primaryWeight + p.accentWeight ? colors[1] : colors[2];
      const alpha = r < p.primaryWeight ? p.primaryAlpha : p.secondaryAlpha;

      for (let d = 0; d < density; d++) {
        const offset = (d / Math.max(1, density)) * cw * p.arcSpread;
        ctx.strokeStyle = hexToRgba(col, alpha);
        ctx.lineWidth = lw;

        ctx.beginPath();
        ctx.arc(0, 0, (cw + offset) / 2, 0, Math.PI / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cw, ch, (cw + offset) / 2, Math.PI, Math.PI * 1.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function drawDiagonal(ctx, rng, ox, oy, cols, rows, cw, ch, lw, density, p) {
  const colors = [p.strokeColor, p.accentColor, p.highlightColor];

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = ox + i * cw;
      const y = oy + j * ch;
      const dir = rng() < 0.5 ? 0 : 1;
      const r = rng();
      const col = r < p.primaryWeight ? colors[0] : r < p.primaryWeight + p.accentWeight ? colors[1] : colors[2];
      const alpha = r < p.primaryWeight ? p.primaryAlpha : p.secondaryAlpha;

      ctx.save();
      ctx.translate(x + cw / 2, y + ch / 2);
      ctx.rotate(p.rotationJitter * (rng() * 2 - 1) * 0.3);
      ctx.translate(-cw / 2, -ch / 2);

      for (let d = 0; d < density; d++) {
        const t = (d + 1) / (density + 1);
        ctx.strokeStyle = hexToRgba(col, alpha);
        ctx.lineWidth = lw;

        ctx.beginPath();
        if (dir === 0) {
          ctx.moveTo(cw * t * p.diagSpread, 0); ctx.lineTo(cw, ch - ch * t * p.diagSpread);
          ctx.moveTo(0, ch * t * p.diagSpread); ctx.lineTo(cw - cw * t * p.diagSpread, ch);
        } else {
          ctx.moveTo(cw - cw * t * p.diagSpread, 0); ctx.lineTo(0, ch - ch * t * p.diagSpread);
          ctx.moveTo(cw, ch * t * p.diagSpread); ctx.lineTo(cw * t * p.diagSpread, ch);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function drawConcentric(ctx, rng, ox, oy, cols, rows, cw, ch, lw, density, p) {
  const colors = [p.strokeColor, p.accentColor, p.highlightColor];
  const layers = density + 1;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = ox + i * cw + cw / 2;
      const y = oy + j * ch + ch / 2;
      const shapeType = Math.floor(rng() * 3);
      const r = rng();
      const col = r < p.primaryWeight ? colors[0] : r < p.primaryWeight + p.accentWeight ? colors[1] : colors[2];

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rotationJitter * (rng() * 2 - 1) * 0.4);

      for (let d = 1; d <= layers; d++) {
        const t = d / (layers + 1);
        const sz = Math.min(cw, ch) * t * p.shapeScale;
        const alpha = p.primaryAlpha - (d - 1) / layers * p.alphaFalloff;
        ctx.strokeStyle = hexToRgba(col, Math.max(0, alpha));
        ctx.lineWidth = lw;

        if (shapeType === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shapeType === 1) {
          ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
        } else {
          const h = sz / 2;
          ctx.beginPath();
          ctx.moveTo(0, -h); ctx.lineTo(h, 0); ctx.lineTo(0, h); ctx.lineTo(-h, 0);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}

function drawCrosshatch(ctx, rng, ox, oy, cols, rows, cw, ch, lw, density, p) {
  const colors = [p.strokeColor, p.accentColor, p.highlightColor];
  const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4];
  const lines = density + 1;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = ox + i * cw;
      const y = oy + j * ch;
      const angle1 = angles[Math.floor(rng() * 4)];
      const angle2 = angle1 + Math.PI / 2 + (rng() - 0.5) * p.crossAngleJitter;
      const r = rng();
      const spread = Math.min(cw, ch) * p.crossSpread;
      const len = Math.min(cw, ch) * p.crossLength;

      ctx.save();
      ctx.translate(x + cw / 2, y + ch / 2);
      ctx.rotate(p.rotationJitter * (rng() * 2 - 1) * 0.5);

      const col1 = r < p.primaryWeight ? colors[0] : r < p.primaryWeight + p.accentWeight ? colors[1] : colors[2];
      ctx.strokeStyle = hexToRgba(col1, p.primaryAlpha);
      ctx.lineWidth = lw;
      for (let d = 0; d < lines; d++) {
        const off = lines === 1 ? 0 : (d / (lines - 1) * 2 - 1) * spread;
        const dx = Math.cos(angle1 + Math.PI / 2) * off;
        const dy = Math.sin(angle1 + Math.PI / 2) * off;
        ctx.beginPath();
        ctx.moveTo(dx - Math.cos(angle1) * len, dy - Math.sin(angle1) * len);
        ctx.lineTo(dx + Math.cos(angle1) * len, dy + Math.sin(angle1) * len);
        ctx.stroke();
      }

      const col2 = r < 0.6 ? colors[2] : colors[0];
      ctx.strokeStyle = hexToRgba(col2, p.secondaryAlpha);
      ctx.lineWidth = lw * p.secondaryWeightRatio;
      for (let d = 0; d < lines; d++) {
        const off = lines === 1 ? 0 : (d / (lines - 1) * 2 - 1) * spread;
        const dx = Math.cos(angle2 + Math.PI / 2) * off;
        const dy = Math.sin(angle2 + Math.PI / 2) * off;
        ctx.beginPath();
        ctx.moveTo(dx - Math.cos(angle2) * len, dy - Math.sin(angle2) * len);
        ctx.lineTo(dx + Math.cos(angle2) * len, dy + Math.sin(angle2) * len);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 8-ZOHREH: 8-pointed star rosette pattern
// ═══════════════════════════════════════════════════════════

function drawZohreh(ctx, rng, ox, oy, cols, rows, cw, ch, lw, density, p) {
  const c1 = hexToRgb(p.strokeColor);
  const c2 = hexToRgb(p.accentColor);
  const c3 = hexToRgb(p.highlightColor);
  const inset = 0.30;
  const iw = 2.5;
  const PI = Math.PI;

  for (let gi = 0; gi < cols; gi++) {
    for (let gj = 0; gj < rows; gj++) {
      const cx = ox + gi * cw + cw / 2;
      const cy = oy + gj * ch + ch / 2;
      const R = Math.min(cw, ch) / 2 * 0.95;

      // Star outer + dimple (inner) points
      const starOuter = [];
      const starInner = [];
      const innerR = R * (1 - inset);

      for (let k = 0; k < 8; k++) {
        const angle = k * PI / 4 - PI / 8;
        starOuter.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
        const midAngle = angle + PI / 8;
        starInner.push({ x: cx + innerR * Math.cos(midAngle), y: cy + innerR * Math.sin(midAngle) });
      }

      // 8-pointed star polygon
      ctx.strokeStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const fn = k === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](starOuter[k].x, starOuter[k].y);
        ctx.lineTo(starInner[k].x, starInner[k].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner octagonal rosette
      const innerOctR = R * 0.45;
      ctx.strokeStyle = `rgb(${c2[0]},${c2[1]},${c2[2]})`;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const angle = k * PI / 4 - PI / 8;
        const fn = k === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](cx + innerOctR * Math.cos(angle), cy + innerOctR * Math.sin(angle));
      }
      ctx.closePath();
      ctx.stroke();

      // Radial lines — inner octagon to star points
      ctx.strokeStyle = `rgba(${c3[0]},${c3[1]},${c3[2]},0.7)`;
      ctx.lineWidth = lw * 0.6;
      for (let k = 0; k < 8; k++) {
        const angle = k * PI / 4 - PI / 8;
        const ix = cx + innerOctR * Math.cos(angle);
        const iy = cy + innerOctR * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(starOuter[k].x, starOuter[k].y);
        ctx.stroke();
      }

      // Connect adjacent dimples (rosette flanks)
      ctx.strokeStyle = `rgba(${c2[0]},${c2[1]},${c2[2]},0.78)`;
      ctx.lineWidth = lw * 0.7;
      for (let k = 0; k < 8; k++) {
        const next = (k + 1) % 8;
        ctx.beginPath();
        ctx.moveTo(starInner[k].x, starInner[k].y);
        ctx.lineTo(starInner[next].x, starInner[next].y);
        ctx.stroke();
      }

      // Interlace: diagonal lines through center
      if (iw > 0) {
        ctx.strokeStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
        ctx.lineWidth = iw;
        for (let k = 0; k < 4; k++) {
          const a = starInner[k];
          const b = starInner[(k + 4) % 8];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Cross shapes in square gaps between stars
      if (gi < cols - 1 && gj < rows - 1) {
        const cornerX = ox + (gi + 1) * cw;
        const cornerY = oy + (gj + 1) * ch;
        const crossR = Math.min(cw, ch) * 0.15;

        ctx.strokeStyle = `rgb(${c3[0]},${c3[1]},${c3[2]})`;
        ctx.lineWidth = lw * 0.7;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a1 = k * PI / 2;
          const a2 = a1 + PI / 4;
          const fn = k === 0 ? 'moveTo' : 'lineTo';
          ctx[fn](cornerX + crossR * Math.cos(a1), cornerY + crossR * Math.sin(a1));
          ctx.lineTo(cornerX + crossR * 0.4 * Math.cos(a2), cornerY + crossR * 0.4 * Math.sin(a2));
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // Border frame
  ctx.strokeStyle = `rgba(${c1[0]},${c1[1]},${c1[2]},0.39)`;
  ctx.lineWidth = lw * 0.5;
  ctx.strokeRect(ox - 5, oy - 5, cols * cw + 10, rows * ch + 10);
}


// ═══════════════════════════════════════════════════════════
// 8-SILI: Star-and-bracelet interlocking pattern
// ═══════════════════════════════════════════════════════════

function drawSili(ctx, rng, ox, oy, cols, rows, cw, ch, lw, density, p) {
  const c1 = hexToRgb(p.strokeColor);
  const c2 = hexToRgb(p.accentColor);
  const c3 = hexToRgb(p.highlightColor);
  const bgC = hexToRgb(p.bgColor);
  const inset = 0.30;
  const iw = 2.5;
  const PI = Math.PI;

  for (let gi = 0; gi < cols; gi++) {
    for (let gj = 0; gj < rows; gj++) {
      const cx = ox + gi * cw + cw / 2;
      const cy = oy + gj * ch + ch / 2;
      const R = Math.min(cw, ch) / 2 * 0.95;

      // Octagon vertices (0° start)
      const octVerts = [];
      for (let k = 0; k < 8; k++) {
        const angle = k * PI / 4;
        octVerts.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
      }

      // Octagon outline (construction guide)
      ctx.strokeStyle = `rgba(${c2[0]},${c2[1]},${c2[2]},0.31)`;
      ctx.lineWidth = lw * 0.4;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const fn = k === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](octVerts[k].x, octVerts[k].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Star points + dimple points
      const starPts = [];
      const dimplePts = [];
      const dimpleR = R * (1 - inset * 1.2);

      for (let k = 0; k < 8; k++) {
        const angle = k * PI / 4;
        starPts.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
        const midAngle = angle + PI / 8;
        dimplePts.push({ x: cx + dimpleR * Math.cos(midAngle), y: cy + dimpleR * Math.sin(midAngle) });
      }

      // Main 8-pointed star
      ctx.strokeStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const fn = k === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](starPts[k].x, starPts[k].y);
        ctx.lineTo(dimplePts[k].x, dimplePts[k].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Sili petals (bracelet kite shapes)
      for (let k = 0; k < 8; k++) {
        const next = (k + 1) % 8;
        const dp = dimplePts[k];
        const sp1 = starPts[k];
        const sp2 = starPts[next];

        const edgeMidX = (sp1.x + sp2.x) / 2;
        const edgeMidY = (sp1.y + sp2.y) / 2;
        const outX = edgeMidX + (edgeMidX - cx) * inset * 0.6;
        const outY = edgeMidY + (edgeMidY - cy) * inset * 0.6;

        // Dimple → petal tip
        ctx.strokeStyle = `rgb(${c2[0]},${c2[1]},${c2[2]})`;
        ctx.lineWidth = lw * 0.85;
        ctx.beginPath();
        ctx.moveTo(dp.x, dp.y);
        ctx.lineTo(outX, outY);
        ctx.stroke();

        // Petal tip → flanking star points
        ctx.strokeStyle = `rgba(${c3[0]},${c3[1]},${c3[2]},0.63)`;
        ctx.lineWidth = lw * 0.55;
        ctx.beginPath();
        ctx.moveTo(outX, outY);
        ctx.lineTo(sp1.x, sp1.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(outX, outY);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.stroke();
      }

      // Inner star (rotated 22.5°)
      const innerR2 = R * 0.38;
      const innerDimpleR2 = innerR2 * (1 - inset * 0.8);
      ctx.strokeStyle = `rgba(${c3[0]},${c3[1]},${c3[2]},0.78)`;
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const angle = k * PI / 4 + PI / 8;
        const fn = k === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](cx + innerR2 * Math.cos(angle), cy + innerR2 * Math.sin(angle));
        const midAngle = angle + PI / 8;
        ctx.lineTo(cx + innerDimpleR2 * Math.cos(midAngle), cy + innerDimpleR2 * Math.sin(midAngle));
      }
      ctx.closePath();
      ctx.stroke();

      // Radial connectors — inner star to outer dimples
      ctx.strokeStyle = `rgba(${c1[0]},${c1[1]},${c1[2]},0.47)`;
      ctx.lineWidth = lw * 0.5;
      for (let k = 0; k < 8; k++) {
        const innerAngle = k * PI / 4 + PI / 8;
        const ix = cx + innerR2 * Math.cos(innerAngle);
        const iy = cy + innerR2 * Math.sin(innerAngle);
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(dimplePts[k].x, dimplePts[k].y);
        ctx.stroke();
      }

      // Interlace weave at crossings
      if (iw > 0) {
        for (let k = 0; k < 4; k++) {
          const a = starPts[k];
          const b = starPts[(k + 4) % 8];
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const dx = (b.x - a.x) * 0.08;
          const dy = (b.y - a.y) * 0.08;

          // Background break
          ctx.strokeStyle = `rgb(${bgC[0]},${bgC[1]},${bgC[2]})`;
          ctx.lineWidth = iw + 2;
          ctx.beginPath();
          ctx.moveTo(midX - dx, midY - dy);
          ctx.lineTo(midX + dx, midY + dy);
          ctx.stroke();

          // Perpendicular crossing line
          ctx.strokeStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
          ctx.lineWidth = lw * 0.9;
          const perpAngle = Math.atan2(b.y - a.y, b.x - a.x) + PI / 2;
          const crossLen = iw * 2;
          ctx.beginPath();
          ctx.moveTo(midX - Math.cos(perpAngle) * crossLen, midY - Math.sin(perpAngle) * crossLen);
          ctx.lineTo(midX + Math.cos(perpAngle) * crossLen, midY + Math.sin(perpAngle) * crossLen);
          ctx.stroke();
        }
      }

      // Cross motif in square gaps
      if (gi < cols - 1 && gj < rows - 1) {
        const cornerX = ox + (gi + 1) * cw;
        const cornerY = oy + (gj + 1) * ch;
        const crossR = Math.min(cw, ch) * 0.2;
        const crossInner = crossR * 0.35;

        ctx.strokeStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
        ctx.lineWidth = lw * 0.8;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a1 = k * PI / 2 - PI / 4;
          const a2 = a1 + PI / 8;
          const fn = k === 0 ? 'moveTo' : 'lineTo';
          ctx[fn](cornerX + crossR * Math.cos(a1), cornerY + crossR * Math.sin(a1));
          ctx.lineTo(cornerX + crossInner * Math.cos(a2), cornerY + crossInner * Math.sin(a2));
        }
        ctx.closePath();
        ctx.stroke();

        // Inner diamond
        ctx.strokeStyle = `rgba(${c2[0]},${c2[1]},${c2[2]},0.63)`;
        ctx.lineWidth = lw * 0.5;
        const dR = crossInner * 1.2;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a = k * PI / 2;
          const fn = k === 0 ? 'moveTo' : 'lineTo';
          ctx[fn](cornerX + dR * Math.cos(a), cornerY + dR * Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // Border
  ctx.strokeStyle = `rgba(${c1[0]},${c1[1]},${c1[2]},0.39)`;
  ctx.lineWidth = lw * 0.5;
  ctx.strokeRect(ox - 5, oy - 5, cols * cw + 10, rows * ch + 10);
}

const drawFns = { truchet: drawTruchet, diagonal: drawDiagonal, concentric: drawConcentric, cross: drawCrosshatch, zohreh: drawZohreh, sili: drawSili };

function shuffleColors(rng, p) {
  const allColors = [p.bgColor, p.strokeColor, p.accentColor, p.highlightColor];
  // Fisher-Yates shuffle using seeded rng
  for (let i = allColors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [allColors[i], allColors[j]] = [allColors[j], allColors[i]];
  }
  return {
    ...p,
    bgColor: allColors[0],
    strokeColor: allColors[1],
    accentColor: allColors[2],
    highlightColor: allColors[3],
  };
}

function renderPattern(canvas, seed, mode, p) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const rng = createRng(seed);
  const sp = shuffleColors(rng, p);

  // Background
  ctx.fillStyle = sp.bgColor;
  ctx.fillRect(0, 0, w, h);

  const margin = Math.min(w, h) * sp.marginPct;
  const drawW = w - margin * 2;
  const drawH = h - margin * 2;
  const cols = sp.gridSize;
  const rows = Math.max(1, Math.round(sp.gridSize * (h / w)));
  const cellW = drawW / cols;
  const cellH = drawH / rows;

  const fn = drawFns[mode] || drawFns.truchet;
  ctx.lineCap = sp.lineCap === 0 ? 'butt' : sp.lineCap === 1 ? 'round' : 'square';
  fn(ctx, rng, margin, margin, cols, rows, cellW, cellH, sp.lineWeight, sp.density, sp);
}

// Pick a random mode from seed
export function modeFromSeed(seed) {
  const rng = createRng(seed);
  return MODES[Math.floor(rng() * MODES.length)];
}

const DEFAULTS = {
  gridSize: 6,
  density: 3,
  lineWeight: 1,
  marginPct: 0.05,
  lineCap: 1,
  primaryWeight: 0.55,
  accentWeight: 0.25,
  primaryAlpha: 1,
  secondaryAlpha: 0.85,
  alphaFalloff: 0.6,
  rotationJitter: 0,
  arcSpread: 0.3,
  diagSpread: 0.45,
  shapeScale: 1.1,
  crossSpread: 0.35,
  crossLength: 0.55,
  crossAngleJitter: 0.75,
  secondaryWeightRatio: 0.1,
  strokeColor: '#D4944A',
  accentColor: '#E8B84B',
  highlightColor: '#F6DFA4',
  bgColor: '#1a1714',
};

export { DEFAULTS as PATTERN_DEFAULTS };
export const PATTERN_MODES = Object.keys(drawFns);

export default function TessellatedPattern({ seed, mode, className = '', gridSize, density, lineWeight, overrides }) {
  const canvasRef = useRef(null);
  const resolvedMode = mode || modeFromSeed(seed);

  const params = {
    ...DEFAULTS,
    ...(gridSize != null && { gridSize }),
    ...(density != null && { density }),
    ...(lineWeight != null && { lineWeight }),
    ...overrides,
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    renderPattern(canvasRef.current, seed, resolvedMode, params);
  });

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', borderRadius: 'inherit' }}
    />
  );
}
