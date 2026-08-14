import Phaser from 'phaser';
import { CELL_SIZE, SpecialType } from '../core/constants';
import { Art, type GemFill } from './palette';
import { GEM_SHAPES, starPath, type GemShape } from './shapes';
import { getActiveTheme, type BackdropKind, type GemFinish } from './themes';

function css(hex: number, alpha = 1): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function bakeCanvas(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  draw(ctx);
  tex.refresh();
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function gemGradient(ctx: CanvasRenderingContext2D, cx: number, cy: number, fill: GemFill): CanvasGradient {
  const grad = ctx.createRadialGradient(cx - 5, cy - 7, 3, cx, cy, 26);
  grad.addColorStop(0, css(fill.lite));
  grad.addColorStop(0.45, css(fill.main));
  grad.addColorStop(1, css(fill.deep));
  return grad;
}

/** Renders a gem body in the theme's finish, then its shape decorations. */
function renderGem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fill: GemFill,
  shape: GemShape,
  finish: GemFinish,
): void {
  const rule = shape.fillRule ?? 'nonzero';
  const trace = () => shape.path(ctx, cx, cy);

  switch (finish) {
    case 'neon': {
      ctx.save();
      ctx.shadowColor = css(fill.main, 0.9);
      ctx.shadowBlur = 9;
      trace();
      ctx.fillStyle = gemGradient(ctx, cx, cy, fill);
      ctx.fill(rule);
      ctx.fill(rule);
      ctx.restore();
      trace();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }
    case 'candy': {
      ctx.save();
      ctx.shadowColor = css(fill.lite, 0.8);
      ctx.shadowBlur = 5;
      trace();
      ctx.fillStyle = gemGradient(ctx, cx, cy, fill);
      ctx.fill(rule);
      ctx.restore();
      trace();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      break;
    }
    case 'soft': {
      ctx.save();
      ctx.shadowColor = 'rgba(90,60,20,0.35)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 2;
      trace();
      ctx.fillStyle = gemGradient(ctx, cx, cy, fill);
      ctx.fill(rule);
      ctx.restore();
      trace();
      ctx.strokeStyle = css(fill.deep, 0.9);
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'toon': {
      trace();
      ctx.fillStyle = css(fill.main);
      ctx.fill(rule);
      // top-light band
      ctx.save();
      trace();
      ctx.clip(rule);
      ctx.fillStyle = css(fill.lite, 0.55);
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy - 12, 20, 10, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      trace();
      ctx.strokeStyle = 'rgba(18,22,42,0.95)';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      break;
    }
    case 'porcelain': {
      ctx.save();
      ctx.shadowColor = 'rgba(90,60,40,0.3)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1.5;
      trace();
      const grad = ctx.createLinearGradient(cx, cy - 22, cx, cy + 22);
      grad.addColorStop(0, css(fill.lite));
      grad.addColorStop(0.5, css(fill.main));
      grad.addColorStop(1, css(fill.deep));
      ctx.fillStyle = grad;
      ctx.fill(rule);
      ctx.restore();
      trace();
      ctx.strokeStyle = css(fill.deep, 0.8);
      ctx.lineWidth = 1.8;
      ctx.stroke();
      break;
    }
  }

  // gloss highlight (toon gets a simple dot instead)
  if (finish === 'toon') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 11, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const gloss = ctx.createRadialGradient(cx - 7, cy - 10, 1, cx - 7, cy - 10, 12);
    gloss.addColorStop(0, `rgba(255,255,255,${finish === 'soft' || finish === 'porcelain' ? 0.55 : 0.85})`);
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    trace();
    ctx.clip(rule);
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(cx - 7, cy - 10, 11, 7, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  shape.decorate?.(ctx, cx, cy, fill);
}

let bakedThemeId: string | null = null;

/** Rebakes textures if the active theme changed since the last bake. */
export function ensureThemeTextures(scene: Phaser.Scene): void {
  if (bakedThemeId !== getActiveTheme().id) {
    generateGemTextures(scene);
  }
}

export function generateGemTextures(scene: Phaser.Scene): void {
  const theme = getActiveTheme();
  bakedThemeId = theme.id;
  const size = CELL_SIZE;
  const cx = size / 2;
  const cy = size / 2;

  theme.gems.forEach((spec, color) => {
    bakeCanvas(scene, `gem-${color}`, size, size, (ctx) => {
      renderGem(ctx, cx, cy, spec.fill, GEM_SHAPES[spec.shape], theme.finish);
    });
  });

  // special overlays — hot beams / cores (theme-agnostic, high contrast)
  bakeCanvas(scene, 'special-line-h', size, size, (ctx) => {
    ctx.save();
    ctx.shadowColor = 'rgba(120,220,255,1)';
    ctx.shadowBlur = 8;
    roundedRectPath(ctx, 8, cy - 4, size - 16, 8, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(160,240,255,1)';
    ctx.beginPath();
    ctx.moveTo(4, cy);
    ctx.lineTo(14, cy - 7);
    ctx.lineTo(14, cy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size - 4, cy);
    ctx.lineTo(size - 14, cy - 7);
    ctx.lineTo(size - 14, cy + 7);
    ctx.closePath();
    ctx.fill();
  });

  bakeCanvas(scene, 'special-line-v', size, size, (ctx) => {
    ctx.save();
    ctx.shadowColor = 'rgba(120,220,255,1)';
    ctx.shadowBlur = 8;
    roundedRectPath(ctx, cx - 4, 8, 8, size - 16, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(160,240,255,1)';
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 7, 14);
    ctx.lineTo(cx + 7, 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, size - 4);
    ctx.lineTo(cx - 7, size - 14);
    ctx.lineTo(cx + 7, size - 14);
    ctx.closePath();
    ctx.fill();
  });

  bakeCanvas(scene, 'special-bomb', size, size, (ctx) => {
    ctx.save();
    ctx.shadowColor = 'rgba(255,120,60,1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 11, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy + 1, 11);
    grad.addColorStop(0, 'rgba(255,240,180,1)');
    grad.addColorStop(0.5, 'rgba(255,120,60,1)');
    grad.addColorStop(1, 'rgba(140,20,10,1)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,220,120,1)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 8);
    ctx.lineTo(cx + 12, cy - 16);
    ctx.stroke();
    starPath(ctx, cx + 13, cy - 17, 4, 4, 1.5);
    ctx.fillStyle = 'rgba(255,240,160,1)';
    ctx.fill();
  });

  bakeCanvas(scene, 'special-color', size, size, (ctx) => {
    const cols = [0xff3d6e, 0xffe03d, 0x2ee87e, 0x38b6ff, 0xc06aff, 0xff9a2e];
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 8;
    cols.forEach((c, i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 15, (i * Math.PI) / 3 - Math.PI / 2, ((i + 1) * Math.PI) / 3 - Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = css(c);
      ctx.fill();
    });
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.fill();
  });

  // ice — crystalline glass (works on all boards)
  bakeCanvas(scene, 'ice-1', size, size, (ctx) => {
    roundedRectPath(ctx, 3, 3, size - 6, size - 6, 12);
    ctx.fillStyle = 'rgba(130,210,255,0.30)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,240,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, 18);
    ctx.lineTo(22, 10);
    ctx.moveTo(18, 26);
    ctx.lineTo(30, 15);
    ctx.stroke();
  });

  bakeCanvas(scene, 'ice-2', size, size, (ctx) => {
    roundedRectPath(ctx, 2, 2, size - 4, size - 4, 12);
    ctx.fillStyle = 'rgba(100,190,255,0.5)';
    ctx.fill();
    ctx.save();
    ctx.shadowColor = 'rgba(160,230,255,0.9)';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = 'rgba(220,245,255,0.95)';
    ctx.lineWidth = 2.5;
    roundedRectPath(ctx, 3, 3, size - 6, size - 6, 11);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.beginPath();
    ctx.moveTo(10, 14);
    ctx.lineTo(24, 8);
    ctx.lineTo(15, 26);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(32, 20);
    ctx.lineTo(44, 15);
    ctx.lineTo(38, 34);
    ctx.closePath();
    ctx.fill();
  });

  // board cells
  bakeCanvas(scene, 'cell-bg', size, size, (ctx) => {
    roundedRectPath(ctx, 3, 3, size - 6, size - 6, 11);
    ctx.fillStyle = css(Art.cellOdd, 0.92);
    ctx.fill();
    ctx.strokeStyle = css(Art.frameStroke, 0.22);
    ctx.lineWidth = 1;
    ctx.stroke();
    const top = ctx.createLinearGradient(0, 3, 0, size / 2);
    top.addColorStop(0, `rgba(255,255,255,${Art.dark ? 0.08 : 0.3})`);
    top.addColorStop(1, 'rgba(255,255,255,0)');
    roundedRectPath(ctx, 3, 3, size - 6, size / 2, 11);
    ctx.fillStyle = top;
    ctx.fill();
  });

  bakeCanvas(scene, 'cell-bg-alt', size, size, (ctx) => {
    roundedRectPath(ctx, 3, 3, size - 6, size - 6, 11);
    ctx.fillStyle = css(Art.cellEven, 0.92);
    ctx.fill();
    ctx.strokeStyle = css(Art.frameStroke, 0.16);
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // selection ring
  bakeCanvas(scene, 'select-ring', size, size, (ctx) => {
    ctx.save();
    ctx.shadowColor = css(Art.selectGlow, 1);
    ctx.shadowBlur = 10;
    roundedRectPath(ctx, 5, 5, size - 10, size - 10, 14);
    ctx.strokeStyle = css(Art.selectGlow, 0.95);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.stroke();
    ctx.restore();
  });

  // map nodes
  bakeCanvas(scene, 'node-open', 64, 64, (ctx) => {
    ctx.save();
    ctx.shadowColor = css(Art.nodeOpen, 0.95);
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(32, 31, 21, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(27, 24, 3, 32, 31, 22);
    grad.addColorStop(0, 'rgba(255,244,200,1)');
    grad.addColorStop(0.55, css(Art.nodeOpen));
    grad.addColorStop(1, css(Art.nodeOpenDeep));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, 31, 21, 0, Math.PI * 2);
    ctx.stroke();
  });

  bakeCanvas(scene, 'node-locked', 64, 64, (ctx) => {
    ctx.beginPath();
    ctx.arc(32, 31, 21, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(27, 24, 3, 32, 31, 22);
    grad.addColorStop(0, css(Art.nodeLocked));
    grad.addColorStop(1, css(Art.nodeLocked, 0.75));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = css(Art.panelStroke, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // buttons — gradient pills
  bakeCanvas(scene, 'btn-gold', 220, 64, (ctx) => {
    ctx.save();
    ctx.shadowColor = css(Art.btnPrimaryGlow, 0.85);
    ctx.shadowBlur = 14;
    roundedRectPath(ctx, 8, 8, 204, 46, 23);
    const grad = ctx.createLinearGradient(0, 8, 0, 54);
    grad.addColorStop(0, css(Art.btnPrimaryFrom));
    grad.addColorStop(1, css(Art.btnPrimaryTo));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    roundedRectPath(ctx, 16, 12, 188, 16, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
    roundedRectPath(ctx, 8, 8, 204, 46, 23);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  bakeCanvas(scene, 'btn-mint', 168, 56, (ctx) => {
    ctx.save();
    ctx.shadowColor = css(Art.btnSecondaryGlow, 0.85);
    ctx.shadowBlur = 12;
    roundedRectPath(ctx, 7, 7, 154, 40, 20);
    const grad = ctx.createLinearGradient(0, 7, 0, 47);
    grad.addColorStop(0, css(Art.btnSecondaryFrom));
    grad.addColorStop(1, css(Art.btnSecondaryTo));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    roundedRectPath(ctx, 14, 10, 140, 13, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fill();
    roundedRectPath(ctx, 7, 7, 154, 40, 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });

  // ---------- booster bar ----------
  // round slot: gradient ring + glass core + gloss
  bakeCanvas(scene, 'booster-slot', 80, 80, (ctx) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.arc(40, 40, 31, 0, Math.PI * 2);
    const ring = ctx.createLinearGradient(0, 9, 0, 71);
    ring.addColorStop(0, css(Art.btnSecondaryFrom));
    ring.addColorStop(1, css(Art.btnSecondaryTo));
    ctx.fillStyle = ring;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(40, 40, 24.5, 0, Math.PI * 2);
    const core = ctx.createRadialGradient(34, 32, 4, 40, 40, 26);
    core.addColorStop(0, css(Art.panelBg, 1));
    core.addColorStop(1, css(Art.boardInset, 1));
    ctx.fillStyle = core;
    ctx.fill();
    // gloss on the ring, top
    ctx.save();
    ctx.beginPath();
    ctx.arc(40, 40, 31, 0, Math.PI * 2);
    ctx.arc(40, 40, 24.5, 0, Math.PI * 2, true);
    ctx.clip('evenodd');
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(40, 22, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(40, 40, 31.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });

  // armed glow ring (hammer aiming mode)
  bakeCanvas(scene, 'booster-ring', 96, 96, (ctx) => {
    ctx.save();
    ctx.shadowColor = css(Art.selectGlow, 1);
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(48, 48, 37, 0, Math.PI * 2);
    ctx.strokeStyle = css(Art.selectGlow, 0.95);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.stroke();
    ctx.restore();
  });

  // hammer icon — golden mallet with spark
  bakeCanvas(scene, 'icon-hammer', 48, 48, (ctx) => {
    ctx.save();
    ctx.translate(24, 26);
    ctx.rotate(-0.55);
    // handle
    const wood = ctx.createLinearGradient(-4, 0, 4, 0);
    wood.addColorStop(0, 'rgba(184,130,62,1)');
    wood.addColorStop(1, 'rgba(122,80,30,1)');
    ctx.fillStyle = wood;
    roundedRectPath(ctx, -3.5, -4, 7, 24, 3.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,54,16,0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // head
    ctx.save();
    ctx.shadowColor = 'rgba(255,210,80,0.9)';
    ctx.shadowBlur = 5;
    const gold = ctx.createLinearGradient(0, -20, 0, -4);
    gold.addColorStop(0, 'rgba(255,224,106,1)');
    gold.addColorStop(1, 'rgba(200,134,10,1)');
    ctx.fillStyle = gold;
    roundedRectPath(ctx, -16, -20, 32, 15, 6);
    ctx.fill();
    ctx.restore();
    roundedRectPath(ctx, -16, -20, 32, 15, 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    roundedRectPath(ctx, -13, -18, 26, 4.5, 2.5);
    ctx.fill();
    ctx.restore();
    // impact spark
    ctx.fillStyle = 'rgba(255,246,180,0.95)';
    starPath(ctx, 40, 12, 4, 6, 2.2);
    ctx.fill();
    starPath(ctx, 34, 20, 4, 3.5, 1.4);
    ctx.fill();
  });

  // shuffle icon — two cycling arrows
  bakeCanvas(scene, 'icon-shuffle', 48, 48, (ctx) => {
    const arrow = (start: number, end: number, color: string) => {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(24, 24, 14, start, end);
      ctx.stroke();
      ctx.restore();
      // arrowhead at end angle
      const hx = 24 + Math.cos(end) * 14;
      const hy = 24 + Math.sin(end) * 14;
      const tangent = end + Math.PI / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(tangent) * 9, hy + Math.sin(tangent) * 9);
      ctx.lineTo(hx + Math.cos(end + Math.PI) * 6, hy + Math.sin(end + Math.PI) * 6);
      ctx.lineTo(hx + Math.cos(end) * 6, hy + Math.sin(end) * 6);
      ctx.closePath();
      ctx.fill();
    };
    arrow(-Math.PI * 0.85, -Math.PI * 0.15, 'rgba(90,214,255,1)');
    arrow(Math.PI * 0.15, Math.PI * 0.85, 'rgba(255,212,74,1)');
  });

  // +5 moves icon — golden stopwatch
  bakeCanvas(scene, 'icon-moves', 48, 48, (ctx) => {
    // crown button + lugs
    ctx.fillStyle = 'rgba(200,134,10,1)';
    roundedRectPath(ctx, 20, 3, 8, 7, 2.5);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = 'rgba(255,210,80,0.9)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(24, 27, 17, 0, Math.PI * 2);
    const gold = ctx.createRadialGradient(19, 21, 3, 24, 27, 18);
    gold.addColorStop(0, 'rgba(255,236,150,1)');
    gold.addColorStop(0.6, 'rgba(255,206,60,1)');
    gold.addColorStop(1, 'rgba(198,132,8,1)');
    ctx.fillStyle = gold;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(24, 27, 17, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(24, 27, 12.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,248,224,0.95)';
    ctx.fill();
    ctx.fillStyle = 'rgba(122,74,10,1)';
    ctx.font = 'bold 13px "Arial Rounded MT Bold", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+5', 24, 27.5);
  });

  // ambient blobs
  const blobs: Array<{ key: string; color: number }> = [
    { key: 'blob-a', color: Art.blobA },
    { key: 'blob-b', color: Art.blobB },
    { key: 'blob-c', color: Art.blobC },
  ];
  for (const b of blobs) {
    bakeCanvas(scene, b.key, 256, 256, (ctx) => {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
      grad.addColorStop(0, css(b.color, 0.55));
      grad.addColorStop(0.5, css(b.color, 0.18));
      grad.addColorStop(1, css(b.color, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    });
  }

  bakeCanvas(scene, 'star-dot', 16, 16, (ctx) => {
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 4;
    starPath(ctx, 8, 8, 4, 6, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.restore();
  });

  // white petal (tinted at use)
  bakeCanvas(scene, 'petal', 20, 20, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.quadraticCurveTo(18, 8, 10, 18);
    ctx.quadraticCurveTo(2, 8, 10, 2);
    ctx.closePath();
    ctx.fill();
  });

  // cartoon cloud
  bakeCanvas(scene, 'cloud', 160, 84, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(44, 52, 26, 0, Math.PI * 2);
    ctx.arc(82, 38, 32, 0, Math.PI * 2);
    ctx.arc(120, 54, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(44, 52, 76, 26);
  });
}

export function specialTextureKey(special: SpecialType): string | null {
  switch (special) {
    case SpecialType.LineH:
      return 'special-line-h';
    case SpecialType.LineV:
      return 'special-line-v';
    case SpecialType.Bomb:
      return 'special-bomb';
    case SpecialType.ColorBomb:
      return 'special-color';
    default:
      return null;
  }
}

function addGlowBlobs(
  scene: Phaser.Scene,
  spots: Array<{ key: string; x: number; y: number; s: number; a: number }>,
): void {
  const blend = Art.dark ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL;
  spots.forEach((b, i) => {
    const img = scene.add.image(b.x, b.y, b.key).setScale(b.s).setAlpha(b.a).setDepth(-19).setBlendMode(blend);
    scene.tweens.add({
      targets: img,
      x: b.x + (i % 2 === 0 ? 30 : -30),
      y: b.y + 18,
      scale: b.s * 1.15,
      alpha: b.a * 0.7,
      duration: 5200 + i * 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  });
}

function addTwinkles(scene: Phaser.Scene, width: number, height: number, count: number, tint?: number): void {
  for (let i = 0; i < count; i += 1) {
    const t = scene.add
      .image(Phaser.Math.Between(20, width - 20), Phaser.Math.Between(20, height - 20), 'star-dot')
      .setDepth(-17)
      .setAlpha(0.7)
      .setScale(Phaser.Math.FloatBetween(0.6, 1.1));
    if (tint !== undefined) t.setTint(tint);
    scene.tweens.add({
      targets: t,
      alpha: 0.08,
      angle: 45,
      duration: Phaser.Math.Between(1400, 2600),
      yoyo: true,
      repeat: -1,
      delay: i * 350,
      ease: 'Sine.easeInOut',
    });
  }
}

function addFloatingMotes(
  scene: Phaser.Scene,
  width: number,
  maxY: number,
  count: number,
  colors: number[],
  alpha: number,
): void {
  for (let i = 0; i < count; i += 1) {
    const bit = scene.add
      .circle(
        Phaser.Math.Between(20, width - 20),
        Phaser.Math.Between(30, maxY),
        Phaser.Math.Between(2, 4),
        colors[i % colors.length],
        alpha,
      )
      .setDepth(-16);
    if (Art.dark) bit.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: bit,
      y: bit.y - Phaser.Math.Between(14, 34),
      x: bit.x + Phaser.Math.Between(-14, 14),
      alpha: alpha * 0.3,
      duration: Phaser.Math.Between(2400, 4600),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: i * 120,
    });
  }
}

function addFallingPetals(scene: Phaser.Scene, width: number, height: number, count: number, tint: number): void {
  for (let i = 0; i < count; i += 1) {
    const startX = Phaser.Math.Between(10, width - 10);
    const startY = Phaser.Math.Between(-height, 0);
    const petal = scene.add
      .image(startX, startY, 'petal')
      .setDepth(-16)
      .setTint(tint)
      .setAlpha(Phaser.Math.FloatBetween(0.5, 0.85))
      .setScale(Phaser.Math.FloatBetween(0.6, 1))
      .setAngle(Phaser.Math.Between(0, 360));
    scene.tweens.add({
      targets: petal,
      y: height + 20,
      x: startX + Phaser.Math.Between(-60, 60),
      angle: petal.angle + Phaser.Math.Between(180, 420),
      duration: Phaser.Math.Between(9000, 16000),
      repeat: -1,
      delay: i * 700,
      onRepeat: () => {
        petal.y = -20;
        petal.x = Phaser.Math.Between(10, width - 10);
      },
    });
  }
}

function addToonClouds(scene: Phaser.Scene, width: number, height: number, count: number): void {
  for (let i = 0; i < count; i += 1) {
    const y = Phaser.Math.Between(40, Math.floor(height * 0.5));
    const cloud = scene.add
      .image(Phaser.Math.Between(0, width), y, 'cloud')
      .setDepth(-18)
      .setAlpha(Phaser.Math.FloatBetween(0.7, 0.95))
      .setScale(Phaser.Math.FloatBetween(0.5, 1.1));
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + width + 200,
      duration: Phaser.Math.Between(24000, 40000),
      repeat: -1,
      onRepeat: () => {
        cloud.x = -120;
        cloud.y = Phaser.Math.Between(40, Math.floor(height * 0.5));
      },
    });
  }
}

function addInkMountains(scene: Phaser.Scene, width: number, height: number): void {
  const layers: Array<{ color: number; alpha: number; base: number; peaks: number[] }> = [
    { color: 0x6a8a74, alpha: 0.18, base: height * 0.5, peaks: [0.35, 0.42, 0.3, 0.45] },
    { color: 0x4a6a58, alpha: 0.12, base: height * 0.56, peaks: [0.44, 0.36, 0.48, 0.4] },
  ];
  for (const layer of layers) {
    const g = scene.add.graphics().setDepth(-18);
    g.fillStyle(layer.color, layer.alpha);
    g.beginPath();
    g.moveTo(-20, height);
    g.lineTo(-20, layer.base);
    layer.peaks.forEach((p, i) => {
      const x = ((i + 0.5) / layer.peaks.length) * (width + 40) - 20;
      g.lineTo(x, height * p);
      const vx = ((i + 1) / layer.peaks.length) * (width + 40) - 20;
      g.lineTo(vx, layer.base);
    });
    g.lineTo(width + 20, height);
    g.closePath();
    g.fillPath();
  }
}

/** Theme-driven ambient stage shared across scenes. */
export function drawPlaygroundBackdrop(
  scene: Phaser.Scene,
  width: number,
  height: number,
  options: { quiet?: boolean } = {},
): void {
  const quiet = options.quiet === true;
  const theme = getActiveTheme();
  const kind: BackdropKind = theme.backdrop;
  const gemColors = theme.gems.map((g) => g.fill.main);

  const bg = scene.add.graphics().setDepth(-20);
  bg.fillGradientStyle(Art.skyTop, Art.skyTop, Art.skyBottom, Art.skyBottom, 1);
  bg.fillRect(0, 0, width, height);

  const blobSpots = quiet
    ? [
        { key: 'blob-c', x: width * 0.2, y: height * 0.08, s: 2.6, a: 0.5 },
        { key: 'blob-b', x: width * 0.85, y: height * 0.05, s: 2.2, a: 0.4 },
      ]
    : [
        { key: 'blob-a', x: width * 0.15, y: height * 0.18, s: 3.2, a: 0.65 },
        { key: 'blob-b', x: width * 0.85, y: height * 0.3, s: 2.8, a: 0.6 },
        { key: 'blob-c', x: width * 0.5, y: height * 0.75, s: 3.6, a: 0.55 },
      ];

  switch (kind) {
    case 'space': {
      addGlowBlobs(scene, blobSpots);
      const starCount = quiet ? 26 : 44;
      for (let i = 0; i < starCount; i += 1) {
        const s = scene.add
          .circle(
            Phaser.Math.Between(8, width - 8),
            Phaser.Math.Between(8, height - 8),
            Phaser.Math.Between(1, 2),
            0xffffff,
            Phaser.Math.FloatBetween(0.25, 0.8),
          )
          .setDepth(-18);
        scene.tweens.add({
          targets: s,
          alpha: 0.15,
          duration: Phaser.Math.Between(900, 2400),
          yoyo: true,
          repeat: -1,
          delay: Phaser.Math.Between(0, 1500),
          ease: 'Sine.easeInOut',
        });
      }
      addTwinkles(scene, width, height, quiet ? 3 : 6);
      addFloatingMotes(scene, width, quiet ? height * 0.26 : height * 0.6, quiet ? 6 : 12, gemColors, 0.5);
      break;
    }
    case 'sparkle': {
      addGlowBlobs(scene, blobSpots);
      addTwinkles(scene, width, height, quiet ? 4 : 8, 0xffd24a);
      addFloatingMotes(scene, width, quiet ? height * 0.26 : height * 0.6, quiet ? 5 : 10, gemColors, 0.45);
      break;
    }
    case 'clouds': {
      addGlowBlobs(scene, blobSpots);
      addToonClouds(scene, width, height, quiet ? 2 : 3);
      addFloatingMotes(scene, width, quiet ? height * 0.26 : height * 0.7, quiet ? 6 : 12, gemColors, 0.4);
      addTwinkles(scene, width, height, quiet ? 2 : 4, 0xffffff);
      break;
    }
    case 'garden': {
      // sun glow, top-left
      addGlowBlobs(scene, [
        { key: 'blob-a', x: width * 0.14, y: height * 0.07, s: quiet ? 2.4 : 3.2, a: 0.75 },
        { key: 'blob-c', x: width * 0.8, y: height * 0.85, s: 3, a: 0.4 },
      ]);
      addFallingPetals(scene, width, height, quiet ? 4 : 7, 0xffc8d8);
      addFloatingMotes(scene, width, quiet ? height * 0.26 : height * 0.7, quiet ? 5 : 9, [0x9ae06a, 0xffe890, 0xffffff], 0.5);
      break;
    }
    case 'toon': {
      addToonClouds(scene, width, height, quiet ? 3 : 5);
      addTwinkles(scene, width, height, quiet ? 3 : 6, 0xfff2a0);
      addFloatingMotes(scene, width, quiet ? height * 0.26 : height * 0.6, quiet ? 4 : 8, gemColors, 0.5);
      break;
    }
    case 'ink': {
      if (!quiet) addInkMountains(scene, width, height);
      // moon glow
      addGlowBlobs(scene, [
        { key: 'blob-a', x: width * 0.82, y: height * 0.08, s: quiet ? 1.8 : 2.4, a: 0.8 },
        { key: 'blob-c', x: width * 0.15, y: height * 0.7, s: 2.8, a: 0.35 },
      ]);
      addFallingPetals(scene, width, height, quiet ? 5 : 9, 0xf0a8c0);
      break;
    }
  }
}

export function drawBoardFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  boardW: number,
  boardH: number,
  pad: number,
): void {
  const frame = scene.add.graphics().setDepth(0);
  const fx = x - pad;
  const fy = y - pad;
  const fw = boardW + pad * 2;
  const fh = boardH + pad * 2;

  frame.fillStyle(0x000000, Art.dark ? 0.45 : 0.22);
  frame.fillRoundedRect(fx + 4, fy + 9, fw, fh, 22);
  frame.fillStyle(Art.frameDark, 0.96);
  frame.fillRoundedRect(fx, fy, fw, fh, 22);
  frame.fillStyle(Art.boardInset, 0.98);
  frame.fillRoundedRect(fx + 9, fy + 9, fw - 18, fh - 18, 16);
  frame.lineStyle(7, Art.frameStroke, 0.18);
  frame.strokeRoundedRect(fx - 2, fy - 2, fw + 4, fh + 4, 24);
  frame.lineStyle(3, Art.frameStroke, 0.95);
  frame.strokeRoundedRect(fx, fy, fw, fh, 22);
  frame.lineStyle(2, Art.frameInner, 0.45);
  frame.strokeRoundedRect(fx + 9, fy + 9, fw - 18, fh - 18, 16);
}

/** Glass HUD chip with themed stroke. */
export function addHudChip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(8);
  g.fillStyle(0x000000, Art.dark ? 0.3 : 0.15);
  g.fillRoundedRect(x + 2, y + 3, w, h, 14);
  g.fillStyle(Art.panelBg, 0.92);
  g.fillRoundedRect(x, y, w, h, 14);
  g.lineStyle(4, Art.panelStroke, 0.2);
  g.strokeRoundedRect(x - 1, y - 1, w + 2, h + 2, 15);
  g.lineStyle(2, Art.panelStroke, 0.85);
  g.strokeRoundedRect(x, y, w, h, 14);
  return g;
}
