import { Art, GEM_FILL, type GemFill, type Palette } from './palette';
import type { GemShapeId } from './shapes';

export type ThemeId = 'digimon' | 'ultraman' | 'royal' | 'candy' | 'garden' | 'toon' | 'guofeng';

/** How gem bodies are rendered on top of the shape path. */
export type GemFinish = 'neon' | 'candy' | 'soft' | 'toon' | 'porcelain';

/** Ambient decoration recipe for the stage backdrop. */
export type BackdropKind = 'space' | 'sparkle' | 'clouds' | 'garden' | 'toon' | 'ink';

export interface GemSpec {
  shape: GemShapeId;
  fill: GemFill;
}

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
  finish: GemFinish;
  backdrop: BackdropKind;
  gems: GemSpec[];
  palette: Palette;
}

const THEME_STORAGE_KEY = 'color-match:theme';

export const THEMES: Record<ThemeId, ThemeDef> = {
  digimon: {
    id: 'digimon',
    name: '数码大冒险',
    tagline: '数码世界 · 进化吧',
    finish: 'toon',
    backdrop: 'space',
    gems: [
      { shape: 'agumon', fill: { main: 0xffa030, deep: 0xc86a08, lite: 0xffd090 } },
      { shape: 'guilmon', fill: { main: 0xe84838, deep: 0xac1a10, lite: 0xff9a88 } },
      { shape: 'palmon', fill: { main: 0x58c858, deep: 0x2a9432, lite: 0xa8eea0 } },
      { shape: 'veemon', fill: { main: 0x3a7ee8, deep: 0x1a4cb0, lite: 0x9ac4ff } },
      { shape: 'renamon', fill: { main: 0xf5c132, deep: 0xc08c0a, lite: 0xffe8a0 } },
      { shape: 'koromon', fill: { main: 0xf58ab8, deep: 0xc84888, lite: 0xffc8de } },
    ],
    palette: {
      dark: true,
      pageBg:
        'radial-gradient(ellipse at 20% 0%, #0e4a4a 0%, transparent 55%),' +
        'radial-gradient(ellipse at 80% 15%, #123a5e 0%, transparent 50%),' +
        'linear-gradient(180deg, #0a2438 0%, #04101c 100%)',
      skyTop: 0x0a2438,
      skyBottom: 0x04101c,
      blobA: 0x2ee8a0,
      blobB: 0xff8a2e,
      blobC: 0x38b6ff,
      path: 0x1e4a5e,
      frame: 0x143a4e,
      frameDark: 0x0a2434,
      boardInset: 0x081a26,
      frameStroke: 0x2ee8a0,
      frameInner: 0x38b6ff,
      cellOdd: 0x14384a,
      cellEven: 0x0f2f40,
      selectGlow: 0x5affc8,
      panelBg: 0x0f2b3c,
      panelStroke: 0x2ee8a0,
      nodeOpen: 0xffb02e,
      nodeOpenDeep: 0xd07808,
      nodeLocked: 0x2e4a5a,
      btnPrimaryFrom: 0xffc94a,
      btnPrimaryTo: 0xff7a1c,
      btnPrimaryGlow: 0xffa02e,
      btnSecondaryFrom: 0x4ae8b0,
      btnSecondaryTo: 0x0a9a6a,
      btnSecondaryGlow: 0x2ec89a,
      heroText: '#eafff6',
      heroMuted: '#8ac8c0',
      titleGlow: '#2ee8a0',
      textInk: '#eafff6',
      textMuted: '#8ab8b0',
      chipBg: '#06202cd9',
      chipText: '#c8f8e8',
      star: '#ffd24a',
      nodeText: '#3a2408',
      nodeTextLocked: '#7a98a8',
      btnPrimaryText: '#4a2604',
      btnSecondaryText: '#04301e',
      dangerText: '#ff8a7a',
      fxStroke: '#0a3a4a',
    },
  },

  ultraman: {
    id: 'ultraman',
    name: '光之英雄',
    tagline: '银河之光 · 守护地球',
    finish: 'toon',
    backdrop: 'space',
    gems: [
      { shape: 'ultra-hero', fill: { main: 0xc8d2e0, deep: 0x8a98b0, lite: 0xf4f8ff } },
      { shape: 'ultra-seven', fill: { main: 0xe03028, deep: 0xa01410, lite: 0xff8a78 } },
      { shape: 'baltan', fill: { main: 0x4ab878, deep: 0x1e7a48, lite: 0xa0e8c0 } },
      { shape: 'kanegon', fill: { main: 0xf0c030, deep: 0xbc8a08, lite: 0xffe898 } },
      { shape: 'zetton', fill: { main: 0x505a80, deep: 0x272e48, lite: 0x8a96c0 } },
      { shape: 'gomora', fill: { main: 0xb0703a, deep: 0x7a4418, lite: 0xe0a878 } },
    ],
    palette: {
      dark: true,
      pageBg:
        'radial-gradient(ellipse at 50% 0%, #4a1a2a 0%, transparent 45%),' +
        'radial-gradient(ellipse at 20% 30%, #1a2a5e 0%, transparent 50%),' +
        'linear-gradient(180deg, #10183c 0%, #060a1c 100%)',
      skyTop: 0x10183c,
      skyBottom: 0x060a1c,
      blobA: 0xff3a4e,
      blobB: 0xaac8ff,
      blobC: 0xd8e0ec,
      path: 0x2a3a6e,
      frame: 0x8a98b8,
      frameDark: 0x5a6880,
      boardInset: 0x101830,
      frameStroke: 0xd8e4f8,
      frameInner: 0xff4a5e,
      cellOdd: 0x1c2848,
      cellEven: 0x16203c,
      selectGlow: 0xff6a7a,
      panelBg: 0x141c3c,
      panelStroke: 0xd8e4f8,
      nodeOpen: 0xff5a5a,
      nodeOpenDeep: 0xc02030,
      nodeLocked: 0x3a4468,
      btnPrimaryFrom: 0xff7a6a,
      btnPrimaryTo: 0xe01c34,
      btnPrimaryGlow: 0xff4a5e,
      btnSecondaryFrom: 0xc8d8f8,
      btnSecondaryTo: 0x6a80b0,
      btnSecondaryGlow: 0x9ab4e8,
      heroText: '#f0f6ff',
      heroMuted: '#8a9ac8',
      titleGlow: '#ff4a5e',
      textInk: '#f0f6ff',
      textMuted: '#8a9ac8',
      chipBg: '#0a1230d9',
      chipText: '#dce8ff',
      star: '#ffd24a',
      nodeText: '#4a0810',
      nodeTextLocked: '#9aa8cc',
      btnPrimaryText: '#fff0f0',
      btnSecondaryText: '#101c3a',
      dangerText: '#ff7a8a',
      fxStroke: '#3a1020',
    },
  },

  royal: {
    id: 'royal',
    name: '皇家王国',
    tagline: '皇家蓝金 · 王座秘宝',
    finish: 'candy',
    backdrop: 'sparkle',
    gems: [
      { shape: 'heart', fill: { main: 0xe83a4e, deep: 0xa81428, lite: 0xff9aa8 } },
      { shape: 'crown', fill: { main: 0xffc424, deep: 0xc8860a, lite: 0xffe8a0 } },
      { shape: 'coin', fill: { main: 0xff9a2e, deep: 0xc06408, lite: 0xffd09a } },
      { shape: 'clover', fill: { main: 0x3ab84e, deep: 0x1a7a2e, lite: 0x9ae8a8 } },
      { shape: 'shield', fill: { main: 0x3a8ae8, deep: 0x1a52a8, lite: 0x9ac8ff } },
      { shape: 'diamond', fill: { main: 0xb060e8, deep: 0x7a2cb0, lite: 0xe0b8ff } },
    ],
    palette: {
      dark: true,
      pageBg:
        'radial-gradient(ellipse at 50% 0%, #3a62d8 0%, transparent 55%),' +
        'linear-gradient(180deg, #2452c8 0%, #102a6e 100%)',
      skyTop: 0x2452c8,
      skyBottom: 0x102a6e,
      blobA: 0x5a86f0,
      blobB: 0xffd24a,
      blobC: 0x84aaff,
      path: 0x4a72d8,
      frame: 0xe8b23a,
      frameDark: 0xb87f10,
      boardInset: 0xf7ecd2,
      frameStroke: 0xffe08a,
      frameInner: 0xd89a1c,
      cellOdd: 0xefe0bd,
      cellEven: 0xe7d5ab,
      selectGlow: 0xffd24a,
      panelBg: 0xfff4dc,
      panelStroke: 0xd89a1c,
      nodeOpen: 0xffc424,
      nodeOpenDeep: 0xc8860a,
      nodeLocked: 0x5a6a94,
      btnPrimaryFrom: 0xffe06a,
      btnPrimaryTo: 0xff9a2e,
      btnPrimaryGlow: 0xffc94a,
      btnSecondaryFrom: 0x6ab0ff,
      btnSecondaryTo: 0x2a62d8,
      btnSecondaryGlow: 0x4a8ae8,
      heroText: '#fff6e0',
      heroMuted: '#bcd0ff',
      titleGlow: '#1a3a8a',
      textInk: '#4a3208',
      textMuted: '#8a7448',
      chipBg: '#102a50cc',
      chipText: '#ffe8b0',
      star: '#ffb818',
      nodeText: '#4a2c08',
      nodeTextLocked: '#c8d2ec',
      btnPrimaryText: '#5a2e04',
      btnSecondaryText: '#ffffff',
      dangerText: '#c8386a',
      fxStroke: '#5a2e04',
    },
  },

  candy: {
    id: 'candy',
    name: '糖果甜品',
    tagline: '粉色糖霜 · 甜蜜暴击',
    finish: 'candy',
    backdrop: 'clouds',
    gems: [
      { shape: 'candy-wrap', fill: { main: 0xf8384e, deep: 0xb80e2e, lite: 0xff9aae } },
      { shape: 'jellybean', fill: { main: 0xff8c28, deep: 0xc85a06, lite: 0xffc898 } },
      { shape: 'lollipop', fill: { main: 0xffd428, deep: 0xd09c04, lite: 0xfff0a0 } },
      { shape: 'gumdrop', fill: { main: 0x4ed048, deep: 0x1e9a28, lite: 0xa8f0a0 } },
      { shape: 'mint-swirl', fill: { main: 0x38b6f8, deep: 0x0a6cc8, lite: 0x9adcff } },
      { shape: 'berry-cluster', fill: { main: 0xc058e8, deep: 0x8624b0, lite: 0xe8b0ff } },
    ],
    palette: {
      dark: false,
      pageBg: 'linear-gradient(180deg, #ffc9e4 0%, #fff3f8 60%, #ffe0ef 100%)',
      skyTop: 0xffc9e4,
      skyBottom: 0xfff3f8,
      blobA: 0xffffff,
      blobB: 0xffa8d0,
      blobC: 0xa8e8ff,
      path: 0xf0a8cc,
      frame: 0xc85aa8,
      frameDark: 0x94327a,
      boardInset: 0xfff0f6,
      frameStroke: 0xf070b8,
      frameInner: 0xffffff,
      cellOdd: 0xffe0ee,
      cellEven: 0xffd2e6,
      selectGlow: 0xff70b8,
      panelBg: 0xfff6fa,
      panelStroke: 0xf070b8,
      nodeOpen: 0xff8ac0,
      nodeOpenDeep: 0xd8488e,
      nodeLocked: 0xd8c0cc,
      btnPrimaryFrom: 0xff9ad0,
      btnPrimaryTo: 0xf0409a,
      btnPrimaryGlow: 0xff70b8,
      btnSecondaryFrom: 0x8ae8d0,
      btnSecondaryTo: 0x2ab89a,
      btnSecondaryGlow: 0x5ad0b0,
      heroText: '#a8206a',
      heroMuted: '#c86a9a',
      titleGlow: '#ffffff',
      textInk: '#7a1a4e',
      textMuted: '#b06088',
      chipBg: '#ffffffd8',
      chipText: '#a8206a',
      star: '#ff9a1c',
      nodeText: '#7a1040',
      nodeTextLocked: '#a890a0',
      btnPrimaryText: '#ffffff',
      btnSecondaryText: '#053a2e',
      dangerText: '#e0245e',
      fxStroke: '#a8206a',
    },
  },

  garden: {
    id: 'garden',
    name: '花园治愈',
    tagline: '暖阳果园 · 治愈时光',
    finish: 'soft',
    backdrop: 'garden',
    gems: [
      { shape: 'strawberry', fill: { main: 0xf03848, deep: 0xb01020, lite: 0xff9aa0 } },
      { shape: 'orange-slice', fill: { main: 0xff9a20, deep: 0xc86a00, lite: 0xffd090 } },
      { shape: 'sunflower', fill: { main: 0xffcc20, deep: 0xd09a00, lite: 0xffe890 } },
      { shape: 'apple', fill: { main: 0x62c832, deep: 0x2e8a12, lite: 0xb0ee90 } },
      { shape: 'blueberry', fill: { main: 0x4a6ae0, deep: 0x2a3aa0, lite: 0xa0b4f8 } },
      { shape: 'grape-cluster', fill: { main: 0x9a50d0, deep: 0x62289a, lite: 0xd0a8f0 } },
    ],
    palette: {
      dark: false,
      pageBg: 'linear-gradient(180deg, #aee2ff 0%, #e8f6d8 65%, #d0ecb8 100%)',
      skyTop: 0xaee2ff,
      skyBottom: 0xdff2c8,
      blobA: 0xffe8a0,
      blobB: 0xffffff,
      blobC: 0xc8f0a8,
      path: 0xc8b088,
      frame: 0xb8823e,
      frameDark: 0x8a5a1e,
      boardInset: 0xf2e4c2,
      frameStroke: 0xd8a860,
      frameInner: 0x8a5a1e,
      cellOdd: 0xe8d8b0,
      cellEven: 0xdfcda2,
      selectGlow: 0xffd24a,
      panelBg: 0xfff8e8,
      panelStroke: 0xc89a4a,
      nodeOpen: 0xffb838,
      nodeOpenDeep: 0xd8860e,
      nodeLocked: 0xc0b8a0,
      btnPrimaryFrom: 0xffd25a,
      btnPrimaryTo: 0xff922e,
      btnPrimaryGlow: 0xffb838,
      btnSecondaryFrom: 0x9ae06a,
      btnSecondaryTo: 0x4aa428,
      btnSecondaryGlow: 0x74c848,
      heroText: '#2f5d1f',
      heroMuted: '#6a8a4e',
      titleGlow: '#fff0b0',
      textInk: '#4a3a12',
      textMuted: '#8a7448',
      chipBg: '#fffdf2d8',
      chipText: '#4a3a12',
      star: '#ff9a1c',
      nodeText: '#4a2c08',
      nodeTextLocked: '#8a8270',
      btnPrimaryText: '#5a2e04',
      btnSecondaryText: '#1a3a08',
      dangerText: '#d8385a',
      fxStroke: '#4a3a12',
    },
  },

  toon: {
    id: 'toon',
    name: '卡通轰趴',
    tagline: '漫画爆炸 · 活力全开',
    finish: 'toon',
    backdrop: 'toon',
    gems: [
      { shape: 'cube-heart', fill: { main: 0xf04438, deep: 0xb01a12, lite: 0xff9a90 } },
      { shape: 'cube-moon', fill: { main: 0xff9224, deep: 0xc86004, lite: 0xffc890 } },
      { shape: 'cube-star', fill: { main: 0xffd028, deep: 0xd09a02, lite: 0xffec98 } },
      { shape: 'cube-leaf', fill: { main: 0x54c838, deep: 0x268e16, lite: 0xa8ec90 } },
      { shape: 'cube-drop', fill: { main: 0x3a90f0, deep: 0x1454b8, lite: 0x9accff } },
      { shape: 'cube-diamond', fill: { main: 0xa858e8, deep: 0x7028b0, lite: 0xd8b0ff } },
    ],
    palette: {
      dark: false,
      pageBg: 'linear-gradient(180deg, #54b8f8 0%, #8adcff 70%, #b8ecff 100%)',
      skyTop: 0x54b8f8,
      skyBottom: 0x8adcff,
      blobA: 0xffffff,
      blobB: 0xffffff,
      blobC: 0xd0f0ff,
      path: 0x74ccff,
      frame: 0x2a3a6e,
      frameDark: 0x1a2445,
      boardInset: 0x30427a,
      frameStroke: 0xffc83a,
      frameInner: 0x4a5e9a,
      cellOdd: 0x3a4e8a,
      cellEven: 0x33477e,
      selectGlow: 0xffe03d,
      panelBg: 0xfff8e8,
      panelStroke: 0x2a3a6e,
      nodeOpen: 0xffcf24,
      nodeOpenDeep: 0xe0940a,
      nodeLocked: 0x8a94b0,
      btnPrimaryFrom: 0xffe04a,
      btnPrimaryTo: 0xff9a1c,
      btnPrimaryGlow: 0xffcf24,
      btnSecondaryFrom: 0x8ae04a,
      btnSecondaryTo: 0x3aa818,
      btnSecondaryGlow: 0x62c832,
      heroText: '#ffffff',
      heroMuted: '#e8f6ff',
      titleGlow: '#1a5a9a',
      textInk: '#2a3a6e',
      textMuted: '#7a86a8',
      chipBg: '#1a2445cc',
      chipText: '#fff2c8',
      star: '#ffcf24',
      nodeText: '#4a2c08',
      nodeTextLocked: '#e8ecf8',
      btnPrimaryText: '#5a2e04',
      btnSecondaryText: '#ffffff',
      dangerText: '#f0506a',
      fxStroke: '#1a2445',
    },
  },

  guofeng: {
    id: 'guofeng',
    name: '国风雅致',
    tagline: '水墨江南 · 步步生莲',
    finish: 'porcelain',
    backdrop: 'ink',
    gems: [
      { shape: 'lantern', fill: { main: 0xd84838, deep: 0x9e2418, lite: 0xf8a090 } },
      { shape: 'ingot', fill: { main: 0xe8b83a, deep: 0xa88012, lite: 0xf8e0a0 } },
      { shape: 'blossom', fill: { main: 0xf088b0, deep: 0xc04878, lite: 0xffc8dc } },
      { shape: 'jade-ring', fill: { main: 0x50b888, deep: 0x24805a, lite: 0xa8e8c8 } },
      { shape: 'teacup', fill: { main: 0x5a8ad0, deep: 0x2e5a9a, lite: 0xaccaf0 } },
      { shape: 'gourd', fill: { main: 0x9a58c8, deep: 0x64308e, lite: 0xd0a8ee } },
    ],
    palette: {
      dark: false,
      pageBg: 'linear-gradient(180deg, #d8e6d2 0%, #f2ede0 60%, #e8e0cc 100%)',
      skyTop: 0xd8e6d2,
      skyBottom: 0xf2ede0,
      blobA: 0xfff2d0,
      blobB: 0xffffff,
      blobC: 0xf8c8c8,
      path: 0xc8b898,
      frame: 0x8a3a2e,
      frameDark: 0x5e241c,
      boardInset: 0xf4ecd8,
      frameStroke: 0xb85a48,
      frameInner: 0xd8a020,
      cellOdd: 0xe9dfc4,
      cellEven: 0xe0d5b6,
      selectGlow: 0xd8a020,
      panelBg: 0xf8f2e2,
      panelStroke: 0xa04a38,
      nodeOpen: 0xd8a020,
      nodeOpenDeep: 0xa87408,
      nodeLocked: 0xb0a890,
      btnPrimaryFrom: 0xe8604a,
      btnPrimaryTo: 0xc03028,
      btnPrimaryGlow: 0xd8503e,
      btnSecondaryFrom: 0x9ad8b0,
      btnSecondaryTo: 0x4a9a6a,
      btnSecondaryGlow: 0x6ab88a,
      heroText: '#4a3226',
      heroMuted: '#8a7460',
      titleGlow: '#e8d8b8',
      textInk: '#4a3226',
      textMuted: '#8a7460',
      chipBg: '#f8f2e2e0',
      chipText: '#6a4a38',
      star: '#d8a020',
      nodeText: '#4a2c08',
      nodeTextLocked: '#7a7260',
      btnPrimaryText: '#fff4e0',
      btnSecondaryText: '#0e3a24',
      dangerText: '#c03028',
      fxStroke: '#5e241c',
    },
  },
};

export const THEME_ORDER: ThemeId[] = ['digimon', 'ultraman', 'royal', 'candy', 'garden', 'toon', 'guofeng'];

let activeThemeId: ThemeId = 'digimon';

export function getActiveTheme(): ThemeDef {
  return THEMES[activeThemeId];
}

/** Overwrites the shared Art palette and gem fills, and re-skins the page. */
export function applyTheme(id: ThemeId): void {
  const theme = THEMES[id];
  activeThemeId = id;
  Object.assign(Art, theme.palette);
  theme.gems.forEach((gem, i) => {
    GEM_FILL[i] = { ...gem.fill };
  });
  if (typeof document !== 'undefined') {
    document.body.style.background = theme.palette.pageBg;
  }
}

export function saveThemeId(id: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // storage unavailable (private mode etc.) — theme just won't persist
  }
}

export function loadThemeId(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw && raw in THEMES) return raw as ThemeId;
  } catch {
    // ignore
  }
  return 'digimon';
}

/** Called once at startup: restore persisted theme. */
export function applyStoredTheme(): void {
  applyTheme(loadThemeId());
}
