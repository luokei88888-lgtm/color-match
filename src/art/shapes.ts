import type { GemFill } from './palette';

/**
 * Gem shape library. Each shape provides a main body `path` (used for the
 * gradient fill, rim light and gloss clipping) plus an optional `decorate`
 * pass drawn on top (sticks, leaves, icons, engravings...).
 */
export type GemShapeId =
  // 霓虹宝石
  | 'heart'
  | 'hexagon'
  | 'star'
  | 'leaf'
  | 'drop'
  | 'diamond'
  // 皇家王国
  | 'crown'
  | 'shield'
  | 'coin'
  | 'clover'
  // 糖果甜品
  | 'candy-wrap'
  | 'jellybean'
  | 'lollipop'
  | 'gumdrop'
  | 'mint-swirl'
  | 'berry-cluster'
  // 花园自然
  | 'strawberry'
  | 'orange-slice'
  | 'sunflower'
  | 'apple'
  | 'blueberry'
  | 'grape-cluster'
  // 美式卡通（方块 + 图标）
  | 'cube-heart'
  | 'cube-star'
  | 'cube-moon'
  | 'cube-drop'
  | 'cube-leaf'
  | 'cube-diamond'
  // 国风雅致
  | 'lantern'
  | 'ingot'
  | 'blossom'
  | 'jade-ring'
  | 'teacup'
  | 'gourd'
  // 数码世界（角色头像）
  | 'agumon'
  | 'guilmon'
  | 'renamon'
  | 'palmon'
  | 'veemon'
  | 'koromon'
  // 光之英雄（角色头像）
  | 'ultra-hero'
  | 'ultra-seven'
  | 'baltan'
  | 'kanegon'
  | 'zetton'
  | 'gomora';

export interface GemShape {
  path: (ctx: CanvasRenderingContext2D, cx: number, cy: number) => void;
  decorate?: (ctx: CanvasRenderingContext2D, cx: number, cy: number, fill: GemFill) => void;
  fillRule?: CanvasFillRule;
}

function css(hex: number, alpha = 1): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function polygon(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

export function starPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  points: number,
  outer: number,
  inner: number,
  rot = -Math.PI / 2,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function heartPathAt(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.moveTo(cx, cy + 15 * s);
  ctx.bezierCurveTo(cx - 23 * s, cy - 3 * s, cx - 13 * s, cy - 19 * s, cx, cy - 6 * s);
  ctx.bezierCurveTo(cx + 13 * s, cy - 19 * s, cx + 23 * s, cy - 3 * s, cx, cy + 15 * s);
  ctx.closePath();
}

function roundedSquarePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, half: number, r: number): void {
  const x = cx - half;
  const y = cy - half;
  const w = half * 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + w, r);
  ctx.arcTo(x + w, y + w, x, y + w, r);
  ctx.arcTo(x, y + w, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Small white icon used on toon cubes. */
function cubeIcon(icon: 'heart' | 'star' | 'moon' | 'drop' | 'leaf' | 'diamond') {
  return (ctx: CanvasRenderingContext2D, cx: number, cy: number): void => {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    switch (icon) {
      case 'heart':
        ctx.beginPath();
        heartPathAt(ctx, cx, cy, 0.42);
        ctx.fill();
        break;
      case 'star':
        starPath(ctx, cx, cy, 5, 9, 4);
        ctx.fill();
        break;
      case 'moon':
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx + 5, cy - 3, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'drop':
        ctx.beginPath();
        ctx.moveTo(cx, cy - 9);
        ctx.bezierCurveTo(cx + 7, cy - 1, cx + 7, cy + 3, cx, cy + 8);
        ctx.bezierCurveTo(cx - 7, cy + 3, cx - 7, cy - 1, cx, cy - 9);
        ctx.fill();
        break;
      case 'leaf':
        ctx.beginPath();
        ctx.ellipse(cx, cy, 6, 9, 0.6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'diamond':
        polygon(ctx, [
          [cx, cy - 9],
          [cx + 7, cy],
          [cx, cy + 9],
          [cx - 7, cy],
        ]);
        ctx.fill();
        break;
    }
    ctx.restore();
  };
}

export const GEM_SHAPES: Record<GemShapeId, GemShape> = {
  // ---------- 霓虹宝石 ----------
  heart: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      heartPathAt(ctx, cx, cy + 1, 1);
    },
  },
  hexagon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const x = cx + Math.cos(a) * 19;
        const y = cy + Math.sin(a) * 19;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.save();
      starPath(ctx, cx, cy, 4, 7, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    },
  },
  star: {
    path: (ctx, cx, cy) => starPath(ctx, cx, cy + 1, 5, 20, 8.5),
  },
  leaf: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14, 18, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.strokeStyle = css(fill.deep, 0.4);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 12);
      ctx.quadraticCurveTo(cx + 4, cy, cx - 1, cy + 13);
      ctx.stroke();
    },
  },
  drop: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 17);
      ctx.bezierCurveTo(cx + 13, cy - 1, cx + 13, cy + 7, cx, cy + 17);
      ctx.bezierCurveTo(cx - 13, cy + 7, cx - 13, cy - 1, cx, cy - 17);
      ctx.closePath();
    },
  },
  diamond: {
    path: (ctx, cx, cy) => {
      polygon(ctx, [
        [cx, cy - 19],
        [cx + 15, cy - 3],
        [cx, cy + 19],
        [cx - 15, cy - 3],
      ]);
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      polygon(ctx, [
        [cx, cy - 19],
        [cx - 15, cy - 3],
        [cx, cy - 3],
      ]);
      ctx.fill();
      ctx.fillStyle = css(fill.deep, 0.5);
      polygon(ctx, [
        [cx, cy - 3],
        [cx + 15, cy - 3],
        [cx, cy + 19],
      ]);
      ctx.fill();
    },
  },

  // ---------- 皇家王国 ----------
  crown: {
    path: (ctx, cx, cy) => {
      polygon(ctx, [
        [cx - 18, cy - 12],
        [cx - 9, cy - 2],
        [cx, cy - 15],
        [cx + 9, cy - 2],
        [cx + 18, cy - 12],
        [cx + 15, cy + 13],
        [cx - 15, cy + 13],
      ]);
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = css(fill.deep, 0.55);
      ctx.fillRect(cx - 15, cy + 7, 30, 3);
      ctx.fillStyle = 'rgba(255,80,120,0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy + 1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const dx of [-18, 0, 18]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy - (dx === 0 ? 15 : 12), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  shield: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy - 14);
      ctx.lineTo(cx + 16, cy - 14);
      ctx.quadraticCurveTo(cx + 16, cy + 6, cx, cy + 18);
      ctx.quadraticCurveTo(cx - 16, cy + 6, cx - 16, cy - 14);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy - 9);
      ctx.lineTo(cx + 11, cy - 9);
      ctx.quadraticCurveTo(cx + 11, cy + 4, cx, cy + 12);
      ctx.quadraticCurveTo(cx - 11, cy + 4, cx - 11, cy - 9);
      ctx.closePath();
      ctx.stroke();
    },
  },
  coin: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.strokeStyle = css(fill.deep, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = css(fill.deep, 0.55);
      starPath(ctx, cx, cy, 5, 8, 3.5);
      ctx.fill();
    },
  },
  clover: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 6, 9, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy - 6, 9, 0, Math.PI * 2);
      ctx.arc(cx - 7, cy + 8, 9, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy + 8, 9, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.strokeStyle = css(fill.deep, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 1, cy + 8);
      ctx.quadraticCurveTo(cx + 3, cy + 15, cx + 6, cy + 19);
      ctx.stroke();
    },
  },

  // ---------- 糖果甜品 ----------
  'candy-wrap': {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // wrapper wings
      ctx.fillStyle = css(fill.main);
      for (const dir of [-1, 1]) {
        polygon(ctx, [
          [cx + dir * 11, cy - 4],
          [cx + dir * 22, cy - 10],
          [cx + dir * 19, cy],
          [cx + dir * 22, cy + 10],
          [cx + dir * 11, cy + 4],
        ]);
        ctx.fill();
        ctx.strokeStyle = css(fill.deep, 0.5);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2.4;
      for (const dx of [-5, 1, 7]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx - 3, cy - 11);
        ctx.quadraticCurveTo(cx + dx + 2, cy, cx + dx - 3, cy + 11);
        ctx.stroke();
      }
    },
  },
  jellybean: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 19, 13, -0.5, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(cx - 6, cy - 6, 6, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  lollipop: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 15, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = 'rgba(255,246,230,0.95)';
      ctx.fillRect(cx - 2, cy + 9, 4, 15);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let t = 0; t < Math.PI * 5; t += 0.2) {
        const r = 1.5 + (t / (Math.PI * 5)) * 12;
        const x = cx + Math.cos(t) * r;
        const y = cy - 4 + Math.sin(t) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      void fill;
    },
  },
  gumdrop: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + 14);
      ctx.quadraticCurveTo(cx - 16, cy - 12, cx, cy - 16);
      ctx.quadraticCurveTo(cx + 16, cy - 12, cx + 15, cy + 14);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [dx, dy] of [
        [-7, -4],
        [3, -9],
        [8, 2],
        [-2, 6],
        [-9, 8],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + dx!, cy + dy!, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  'mint-swirl': {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 4.5;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(cx - 20 + i * 9, cy - 20);
        ctx.lineTo(cx - 4 + i * 9, cy + 20);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  'berry-cluster': {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 7, 8, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 6, 8, 0, Math.PI * 2);
      ctx.arc(cx - 8, cy + 7, 8, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy + 8, 8, 0, Math.PI * 2);
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const [dx, dy] of [
        [-9, -9],
        [6, -8],
        [-2, -2],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + dx!, cy + dy!, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  // ---------- 花园自然 ----------
  strawberry: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy - 6);
      ctx.quadraticCurveTo(cx - 15, cy + 12, cx, cy + 18);
      ctx.quadraticCurveTo(cx + 15, cy + 12, cx + 15, cy - 6);
      ctx.quadraticCurveTo(cx, cy - 14, cx - 15, cy - 6);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = 'rgba(58,160,60,0.95)';
      for (const a of [-0.9, -0.3, 0.3, 0.9]) {
        ctx.beginPath();
        ctx.ellipse(cx + Math.sin(a) * 8, cy - 9, 5, 2.6, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = css(fill.lite, 0.9);
      for (const [dx, dy] of [
        [-7, 0],
        [0, 3],
        [7, 0],
        [-4, 9],
        [4, 9],
      ]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx!, cy + dy!, 1.2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  'orange-slice': {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.strokeStyle = 'rgba(255,244,220,0.95)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3);
        ctx.lineTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
        ctx.stroke();
      }
      void fill;
    },
  },
  sunflower: {
    path: (ctx, cx, cy) => {
      starPath(ctx, cx, cy, 8, 19, 11);
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = 'rgba(122,74,24,0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = css(fill.lite, 0.7);
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  apple: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.bezierCurveTo(cx - 6, cy - 16, cx - 17, cy - 12, cx - 16, cy - 1);
      ctx.bezierCurveTo(cx - 15, cy + 10, cx - 8, cy + 17, cx, cy + 16);
      ctx.bezierCurveTo(cx + 8, cy + 17, cx + 15, cy + 10, cx + 16, cy - 1);
      ctx.bezierCurveTo(cx + 17, cy - 12, cx + 6, cy - 16, cx, cy - 10);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.strokeStyle = 'rgba(106,74,32,0.95)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.quadraticCurveTo(cx + 2, cy - 16, cx + 5, cy - 19);
      ctx.stroke();
      ctx.fillStyle = 'rgba(74,160,60,0.95)';
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy - 17, 6, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  blueberry: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.strokeStyle = css(fill.deep, 0.85);
      ctx.lineWidth = 1.8;
      starPath(ctx, cx, cy - 10, 5, 4.5, 2);
      ctx.stroke();
    },
  },
  'grape-cluster': {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 6, 7, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 6, 7, 0, Math.PI * 2);
      ctx.arc(cx, cy - 2, 7.5, 0, Math.PI * 2);
      ctx.arc(cx - 6, cy + 7, 7, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 7, 7, 0, Math.PI * 2);
      ctx.arc(cx, cy + 15, 6.5, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.strokeStyle = 'rgba(106,74,32,0.9)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11);
      ctx.quadraticCurveTo(cx + 1, cy - 17, cx + 4, cy - 20);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(cx - 9, cy - 8, 2.2, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  // ---------- 美式卡通 ----------
  'cube-heart': {
    path: (ctx, cx, cy) => roundedSquarePath(ctx, cx, cy, 19, 8),
    decorate: (ctx, cx, cy) => cubeIcon('heart')(ctx, cx, cy),
  },
  'cube-star': {
    path: (ctx, cx, cy) => roundedSquarePath(ctx, cx, cy, 19, 8),
    decorate: (ctx, cx, cy) => cubeIcon('star')(ctx, cx, cy),
  },
  'cube-moon': {
    path: (ctx, cx, cy) => roundedSquarePath(ctx, cx, cy, 19, 8),
    decorate: (ctx, cx, cy) => cubeIcon('moon')(ctx, cx, cy),
  },
  'cube-drop': {
    path: (ctx, cx, cy) => roundedSquarePath(ctx, cx, cy, 19, 8),
    decorate: (ctx, cx, cy) => cubeIcon('drop')(ctx, cx, cy),
  },
  'cube-leaf': {
    path: (ctx, cx, cy) => roundedSquarePath(ctx, cx, cy, 19, 8),
    decorate: (ctx, cx, cy) => cubeIcon('leaf')(ctx, cx, cy),
  },
  'cube-diamond': {
    path: (ctx, cx, cy) => roundedSquarePath(ctx, cx, cy, 19, 8),
    decorate: (ctx, cx, cy) => cubeIcon('diamond')(ctx, cx, cy),
  },

  // ---------- 国风雅致 ----------
  lantern: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 16, 13, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = css(fill.deep);
      ctx.fillRect(cx - 6, cy - 17, 12, 4);
      ctx.fillRect(cx - 6, cy + 13, 12, 4);
      ctx.strokeStyle = css(fill.deep, 0.55);
      ctx.lineWidth = 1.2;
      for (const dx of [-9, -4.5, 0, 4.5, 9]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy - 12);
        ctx.quadraticCurveTo(cx + dx * 1.3, cy, cx + dx, cy + 12);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,200,80,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 17);
      ctx.lineTo(cx, cy + 23);
      ctx.stroke();
    },
  },
  ingot: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 19, cy + 2);
      ctx.quadraticCurveTo(cx - 22, cy - 8, cx - 12, cy - 8);
      ctx.quadraticCurveTo(cx, cy - 1, cx + 12, cy - 8);
      ctx.quadraticCurveTo(cx + 22, cy - 8, cx + 19, cy + 2);
      ctx.quadraticCurveTo(cx + 14, cy + 12, cx, cy + 12);
      ctx.quadraticCurveTo(cx - 14, cy + 12, cx - 19, cy + 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = css(fill.lite, 0.95);
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 11, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(fill.deep, 0.5);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    },
  },
  blossom: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.arc(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 9.5, 0, Math.PI * 2);
      }
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.fillStyle = 'rgba(255,214,80,0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,72,120,0.8)';
      for (let i = 0; i < 5; i += 1) {
        const a = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 7.5, cy + Math.sin(a) * 7.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  'jade-ring': {
    fillRule: 'evenodd',
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.strokeStyle = css(fill.deep, 0.6);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 13, -2.4, -0.6);
      ctx.stroke();
    },
  },
  teacup: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 17, cy - 8);
      ctx.lineTo(cx + 17, cy - 8);
      ctx.quadraticCurveTo(cx + 15, cy + 14, cx, cy + 15);
      ctx.quadraticCurveTo(cx - 15, cy + 14, cx - 17, cy - 8);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      ctx.fillStyle = css(fill.lite);
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 17, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(fill.deep, 0.8);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = css(fill.deep, 0.7);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx - 4, cy + 4, 4.5, 0.4, 2.6);
      ctx.moveTo(cx + 9, cy + 2);
      ctx.quadraticCurveTo(cx + 5, cy + 5, cx + 8, cy + 8);
      ctx.stroke();
      // saucer
      ctx.fillStyle = css(fill.main, 0.9);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 17, 13, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  gourd: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 8.5, Math.PI * 0.86, Math.PI * 2.14);
      ctx.arc(cx, cy + 6, 13, -Math.PI * 0.42, Math.PI * 1.42);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      ctx.strokeStyle = 'rgba(106,64,24,0.95)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 18);
      ctx.quadraticCurveTo(cx + 4, cy - 22, cx + 7, cy - 21);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,200,80,0.9)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 10);
      ctx.quadraticCurveTo(cx, cy - 6, cx + 8, cy - 10);
      ctx.stroke();
    },
  },

  // ---------- 数码世界（角色头像） ----------
  agumon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 4);
      ctx.quadraticCurveTo(cx - 18, cy - 12, cx - 6, cy - 16);
      ctx.quadraticCurveTo(cx, cy - 18, cx + 6, cy - 16);
      ctx.quadraticCurveTo(cx + 18, cy - 12, cx + 16, cy + 4);
      ctx.quadraticCurveTo(cx + 15, cy + 15, cx, cy + 16);
      ctx.quadraticCurveTo(cx - 15, cy + 15, cx - 16, cy + 4);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // green eyes
      for (const dx of [-8, 8]) {
        ctx.fillStyle = 'rgba(80,180,90,1)';
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy - 6, 3, 4.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(20,30,20,1)';
        ctx.beginPath();
        ctx.arc(cx + dx, cy - 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(cx + dx - 1, cy - 8, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      // nostrils
      ctx.fillStyle = css(fill.deep, 0.95);
      for (const dx of [-3.5, 3.5]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // wide mouth with teeth
      ctx.strokeStyle = css(fill.deep, 0.95);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 9);
      ctx.quadraticCurveTo(cx, cy + 13, cx + 11, cy + 9);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      for (const dx of [-6, 5]) {
        polygon(ctx, [
          [cx + dx, cy + 10.5],
          [cx + dx + 3, cy + 10.5],
          [cx + dx + 1.5, cy + 7.5],
        ]);
        ctx.fill();
      }
    },
  },
  guilmon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 16);
      ctx.quadraticCurveTo(cx, cy - 18, cx + 6, cy - 16);
      ctx.lineTo(cx + 21, cy - 13);
      ctx.lineTo(cx + 14, cy - 2);
      ctx.quadraticCurveTo(cx + 17, cy + 12, cx, cy + 16);
      ctx.quadraticCurveTo(cx - 17, cy + 12, cx - 14, cy - 2);
      ctx.lineTo(cx - 21, cy - 13);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // yellow slit eyes
      for (const dx of [-7, 7]) {
        ctx.fillStyle = 'rgba(250,210,60,1)';
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy - 5, 3.2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(30,20,10,1)';
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy - 5, 1.1, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // nostrils + zigzag mouth
      ctx.fillStyle = css(fill.deep, 0.95);
      for (const dx of [-3, 3]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = css(fill.deep, 0.95);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 9);
      for (let i = 0; i < 5; i += 1) {
        ctx.lineTo(cx - 10 + (i + 0.5) * 4, cy + (i % 2 === 0 ? 12 : 9));
      }
      ctx.stroke();
      // ear stripes
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.4;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 16, cy - 11.5);
        ctx.lineTo(cx + dir * 13.5, cy - 7);
        ctx.stroke();
      }
    },
  },
  renamon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 3);
      ctx.lineTo(cx - 19, cy - 20);
      ctx.lineTo(cx - 6, cy - 11);
      ctx.quadraticCurveTo(cx, cy - 13, cx + 6, cy - 11);
      ctx.lineTo(cx + 19, cy - 20);
      ctx.lineTo(cx + 18, cy - 3);
      ctx.quadraticCurveTo(cx + 12, cy + 12, cx, cy + 17);
      ctx.quadraticCurveTo(cx - 12, cy + 12, cx - 18, cy - 3);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // ear inners
      ctx.fillStyle = css(fill.deep, 0.7);
      for (const dir of [-1, 1]) {
        polygon(ctx, [
          [cx + dir * 16.5, cy - 16.5],
          [cx + dir * 10, cy - 10.5],
          [cx + dir * 15.5, cy - 7],
        ]);
        ctx.fill();
      }
      // white muzzle mask
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 2);
      ctx.quadraticCurveTo(cx, cy - 2, cx + 9, cy + 2);
      ctx.quadraticCurveTo(cx + 7, cy + 11, cx, cy + 15.5);
      ctx.quadraticCurveTo(cx - 7, cy + 11, cx - 9, cy + 2);
      ctx.closePath();
      ctx.fill();
      // slanted ice-blue eyes
      for (const dir of [-1, 1]) {
        ctx.save();
        ctx.translate(cx + dir * 7.5, cy - 3);
        ctx.rotate(dir * 0.35);
        ctx.fillStyle = 'rgba(120,190,255,1)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.6, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(20,30,50,1)';
        ctx.beginPath();
        ctx.arc(0.5, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // nose
      ctx.fillStyle = 'rgba(40,30,40,0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy + 8, 1.4, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  palmon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 16, 14.5, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // pink flower on top
      ctx.fillStyle = 'rgba(245,130,180,1)';
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 6, cy - 14 + Math.sin(a) * 6, 4.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(190,70,120,0.8)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 6, cy - 14 + Math.sin(a) * 6, 4.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,220,90,1)';
      ctx.beginPath();
      ctx.arc(cx, cy - 14, 3, 0, Math.PI * 2);
      ctx.fill();
      // big friendly eyes
      for (const dx of [-6.5, 6.5]) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy + 1, 3.4, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(30,40,30,1)';
        ctx.beginPath();
        ctx.arc(cx + dx + 0.5, cy + 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // smile
      ctx.strokeStyle = css(fill.deep, 0.95);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 9);
      ctx.quadraticCurveTo(cx, cy + 13, cx + 6, cy + 9);
      ctx.stroke();
    },
  },
  veemon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 3);
      ctx.quadraticCurveTo(cx - 18, cy - 8, cx - 11, cy - 13);
      ctx.lineTo(cx - 18, cy - 19);
      ctx.lineTo(cx - 5, cy - 16);
      ctx.quadraticCurveTo(cx, cy - 17, cx + 5, cy - 16);
      ctx.lineTo(cx + 18, cy - 19);
      ctx.lineTo(cx + 11, cy - 13);
      ctx.quadraticCurveTo(cx + 18, cy - 8, cx + 16, cy + 3);
      ctx.quadraticCurveTo(cx + 14, cy + 14, cx, cy + 16);
      ctx.quadraticCurveTo(cx - 14, cy + 14, cx - 16, cy + 3);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // white muzzle
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8.5, 10, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // red eyes
      for (const dx of [-7, 7]) {
        ctx.fillStyle = 'rgba(220,50,60,1)';
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy - 3, 2.8, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(30,10,10,1)';
        ctx.beginPath();
        ctx.arc(cx + dx, cy - 2, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      // yellow V on forehead
      ctx.strokeStyle = 'rgba(255,210,60,1)';
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, cy - 14);
      ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx + 5.5, cy - 14);
      ctx.stroke();
      // nostrils + grin
      ctx.fillStyle = css(fill.deep, 0.9);
      for (const dx of [-2.5, 2.5]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 6, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = css(fill.deep, 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 10);
      ctx.quadraticCurveTo(cx, cy + 13, cx + 6, cy + 10);
      ctx.stroke();
    },
  },
  koromon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + 7);
      ctx.quadraticCurveTo(cx - 18, cy - 5, cx - 10, cy - 10);
      ctx.lineTo(cx - 15, cy - 21);
      ctx.quadraticCurveTo(cx - 4, cy - 15, cx - 1, cy - 12);
      ctx.quadraticCurveTo(cx + 2, cy - 15, cx + 13, cy - 21);
      ctx.lineTo(cx + 10, cy - 10);
      ctx.quadraticCurveTo(cx + 18, cy - 5, cx + 15, cy + 7);
      ctx.quadraticCurveTo(cx + 10, cy + 16, cx, cy + 16);
      ctx.quadraticCurveTo(cx - 10, cy + 16, cx - 15, cy + 7);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // big ruby eyes
      for (const dx of [-6.5, 6.5]) {
        ctx.fillStyle = 'rgba(200,40,60,1)';
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 0.5, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(cx + dx - 1.4, cy - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // wide happy mouth
      ctx.strokeStyle = css(fill.deep, 0.95);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 8);
      ctx.quadraticCurveTo(cx, cy + 13, cx + 8, cy + 8);
      ctx.stroke();
      // blush
      ctx.fillStyle = css(fill.lite, 0.8);
      for (const dx of [-12, 12]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy + 6, 2.4, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  // ---------- 光之英雄（角色头像） ----------
  'ultra-hero': {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 2);
      ctx.quadraticCurveTo(cx - 13, cy - 10, cx - 7, cy - 14);
      ctx.quadraticCurveTo(cx - 4, cy - 15.5, cx - 2, cy - 16);
      ctx.lineTo(cx - 1.6, cy - 21);
      ctx.lineTo(cx + 1.6, cy - 21);
      ctx.lineTo(cx + 2, cy - 16);
      ctx.quadraticCurveTo(cx + 4, cy - 15.5, cx + 7, cy - 14);
      ctx.quadraticCurveTo(cx + 13, cy - 10, cx + 12, cy + 2);
      ctx.quadraticCurveTo(cx + 11, cy + 13, cx, cy + 17);
      ctx.quadraticCurveTo(cx - 11, cy + 13, cx - 12, cy + 2);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // glowing almond eyes
      for (const dir of [-1, 1]) {
        ctx.save();
        ctx.translate(cx + dir * 6.5, cy - 3);
        ctx.rotate(dir * 0.45);
        ctx.shadowColor = 'rgba(255,230,120,0.95)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(255,225,100,1)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // crest highlight
      ctx.fillStyle = css(fill.deep, 0.8);
      ctx.fillRect(cx - 0.8, cy - 15.5, 1.6, 8);
      // mouth
      ctx.strokeStyle = css(fill.deep, 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 10);
      ctx.quadraticCurveTo(cx, cy + 11.5, cx + 4, cy + 10);
      ctx.stroke();
      // cheek seams
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 8, cy + 3);
        ctx.quadraticCurveTo(cx + dir * 6, cy + 8, cx + dir * 3.5, cy + 11);
        ctx.stroke();
      }
    },
  },
  'ultra-seven': {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 13, cy + 1);
      ctx.quadraticCurveTo(cx - 14, cy - 9, cx - 8, cy - 13);
      ctx.lineTo(cx - 3, cy - 14);
      ctx.lineTo(cx, cy - 22);
      ctx.lineTo(cx + 3, cy - 14);
      ctx.lineTo(cx + 8, cy - 13);
      ctx.quadraticCurveTo(cx + 14, cy - 9, cx + 13, cy + 1);
      ctx.quadraticCurveTo(cx + 12, cy + 13, cx, cy + 17);
      ctx.quadraticCurveTo(cx - 12, cy + 13, cx - 13, cy + 1);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // silver eye slugger crest
      ctx.fillStyle = 'rgba(225,232,245,1)';
      polygon(ctx, [
        [cx - 3, cy - 13.5],
        [cx, cy - 21.5],
        [cx + 3, cy - 13.5],
        [cx + 1.5, cy - 8],
        [cx - 1.5, cy - 8],
      ]);
      ctx.fill();
      // round glowing eyes
      for (const dx of [-6.5, 6.5]) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,230,120,0.95)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(255,225,100,1)';
        ctx.beginPath();
        ctx.arc(cx + dx, cy - 2, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // ear pods
      ctx.fillStyle = 'rgba(225,232,245,1)';
      for (const dx of [-12, 12]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // mouth
      ctx.strokeStyle = css(fill.deep, 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 10);
      ctx.quadraticCurveTo(cx, cy + 11.5, cx + 4, cy + 10);
      ctx.stroke();
    },
  },
  baltan: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 6);
      ctx.quadraticCurveTo(cx - 16, cy - 6, cx - 9, cy - 11);
      ctx.lineTo(cx - 16, cy - 21);
      ctx.lineTo(cx - 4, cy - 13);
      ctx.quadraticCurveTo(cx, cy - 14, cx + 4, cy - 13);
      ctx.lineTo(cx + 16, cy - 21);
      ctx.lineTo(cx + 9, cy - 11);
      ctx.quadraticCurveTo(cx + 16, cy - 6, cx + 14, cy + 6);
      ctx.quadraticCurveTo(cx + 10, cy + 15, cx, cy + 16);
      ctx.quadraticCurveTo(cx - 10, cy + 15, cx - 14, cy + 6);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // huge glowing compound eyes
      for (const dx of [-6.5, 6.5]) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,220,90,0.95)';
        ctx.shadowBlur = 7;
        ctx.fillStyle = 'rgba(255,210,70,1)';
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy - 1, 4.6, 5.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // mandible slits
      ctx.strokeStyle = css(fill.deep, 0.95);
      ctx.lineWidth = 1.6;
      for (const dx of [-4.5, -1.5, 1.5, 4.5]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy + 8);
        ctx.lineTo(cx + dx, cy + 13);
        ctx.stroke();
      }
      // antenna tips
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + dir * 15, cy - 20, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  kanegon: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 10);
      ctx.quadraticCurveTo(cx - 17, cy - 8, cx - 8, cy - 13);
      ctx.quadraticCurveTo(cx, cy - 15, cx + 8, cy - 13);
      ctx.quadraticCurveTo(cx + 17, cy - 8, cx + 16, cy + 10);
      ctx.quadraticCurveTo(cx, cy + 18, cx - 16, cy + 10);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // eye stalks
      ctx.strokeStyle = css(fill.deep, 0.95);
      ctx.lineWidth = 2;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 6, cy - 13);
        ctx.lineTo(cx + dir * 7, cy - 18);
        ctx.stroke();
      }
      for (const dir of [-1, 1]) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(cx + dir * 7, cy - 20, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(20,20,30,1)';
        ctx.beginPath();
        ctx.arc(cx + dir * 7.5, cy - 20, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // coin-purse zipper mouth
      ctx.fillStyle = css(fill.deep, 0.9);
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 2);
      ctx.quadraticCurveTo(cx, cy + 7, cx + 11, cy + 2);
      ctx.quadraticCurveTo(cx + 9, cy + 12, cx, cy + 13);
      ctx.quadraticCurveTo(cx - 9, cy + 12, cx - 11, cy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 5);
      ctx.quadraticCurveTo(cx, cy + 9, cx + 9, cy + 5);
      ctx.stroke();
      for (const dx of [-6, -2, 2, 6]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy + 4.5 + Math.abs(dx) * 0.15);
        ctx.lineTo(cx + dx, cy + 7.5 + Math.abs(dx) * 0.15);
        ctx.stroke();
      }
    },
  },
  zetton: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 12);
      ctx.lineTo(cx - 15, cy - 8);
      ctx.lineTo(cx - 10, cy - 13);
      ctx.lineTo(cx - 9, cy - 20);
      ctx.lineTo(cx - 5, cy - 13);
      ctx.lineTo(cx + 5, cy - 13);
      ctx.lineTo(cx + 9, cy - 20);
      ctx.lineTo(cx + 10, cy - 13);
      ctx.lineTo(cx + 15, cy - 8);
      ctx.lineTo(cx + 14, cy + 12);
      ctx.quadraticCurveTo(cx, cy + 17, cx - 14, cy + 12);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy) => {
      // yellow face plates
      ctx.fillStyle = 'rgba(240,205,70,0.95)';
      polygon(ctx, [
        [cx - 8, cy - 8],
        [cx - 2, cy - 6],
        [cx - 2, cy + 10],
        [cx - 8, cy + 8],
      ]);
      ctx.fill();
      polygon(ctx, [
        [cx + 8, cy - 8],
        [cx + 2, cy - 6],
        [cx + 2, cy + 10],
        [cx + 8, cy + 8],
      ]);
      ctx.fill();
      // orange glow nodes
      ctx.save();
      ctx.shadowColor = 'rgba(255,140,40,0.95)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = 'rgba(255,150,50,1)';
      for (const [dx, dy] of [
        [-11.5, -3],
        [11.5, -3],
        [0, -9.5],
        [0, 1],
        [0, 8],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + dx!, cy + dy!, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  gomora: {
    path: (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy - 6);
      ctx.quadraticCurveTo(cx - 22, cy - 10, cx - 19, cy - 21);
      ctx.quadraticCurveTo(cx - 12, cy - 14, cx - 7, cy - 13);
      ctx.quadraticCurveTo(cx, cy - 15, cx + 7, cy - 13);
      ctx.quadraticCurveTo(cx + 12, cy - 14, cx + 19, cy - 21);
      ctx.quadraticCurveTo(cx + 22, cy - 10, cx + 11, cy - 6);
      ctx.quadraticCurveTo(cx + 15, cy + 2, cx + 12, cy + 8);
      ctx.quadraticCurveTo(cx + 8, cy + 16, cx, cy + 17);
      ctx.quadraticCurveTo(cx - 8, cy + 16, cx - 12, cy + 8);
      ctx.quadraticCurveTo(cx - 15, cy + 2, cx - 11, cy - 6);
      ctx.closePath();
    },
    decorate: (ctx, cx, cy, fill) => {
      // nose horn
      ctx.fillStyle = css(fill.lite, 0.95);
      polygon(ctx, [
        [cx, cy + 0.5],
        [cx + 3.5, cy + 9],
        [cx - 3.5, cy + 9],
      ]);
      ctx.fill();
      ctx.strokeStyle = css(fill.deep, 0.8);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // fierce little eyes + brows
      ctx.fillStyle = 'rgba(30,20,15,1)';
      for (const dx of [-7, 7]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = css(fill.deep, 0.95);
      ctx.lineWidth = 2;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + dir * 10, cy - 6);
        ctx.lineTo(cx + dir * 4, cy - 4);
        ctx.stroke();
      }
      // nostrils
      ctx.fillStyle = css(fill.deep, 0.9);
      for (const dx of [-2.5, 2.5]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 13, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
};
