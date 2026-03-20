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

const MODES = ['truchet', 'diagonal', 'concentric'];

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

const drawFns = { truchet: drawTruchet, diagonal: drawDiagonal, concentric: drawConcentric, cross: drawCrosshatch };

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

export default function TessellatedPattern({ seed, mode, className = '', gridSize, density, lineWeight }) {
  const canvasRef = useRef(null);
  const resolvedMode = mode || modeFromSeed(seed);

  const params = {
    ...DEFAULTS,
    ...(gridSize != null && { gridSize }),
    ...(density != null && { density }),
    ...(lineWeight != null && { lineWeight }),
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    renderPattern(canvasRef.current, seed, resolvedMode, params);
  }, [seed, resolvedMode, gridSize, density, lineWeight]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', borderRadius: 'inherit' }}
    />
  );
}
