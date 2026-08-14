/**
 * Mutable, theme-driven palette. `Art` and `GEM_FILL` hold the values of the
 * currently active theme; `applyTheme` (see themes.ts) overwrites them.
 * Scenes read these at create() time, so a theme switch takes effect on the
 * next scene (re)start.
 */
export const DISPLAY_FONT = '"Fredoka", "Nunito", "PingFang SC", "Microsoft YaHei", sans-serif';
export const BODY_FONT = '"Nunito", "PingFang SC", "Microsoft YaHei", sans-serif';

export interface GemFill {
  main: number;
  deep: number;
  lite: number;
}

export interface Palette {
  /** True for dark stages (affects blend modes and sparkle colors). */
  dark: boolean;
  /** CSS background applied to the page body. */
  pageBg: string;

  // stage
  skyTop: number;
  skyBottom: number;
  blobA: number;
  blobB: number;
  blobC: number;
  path: number;

  // board
  frame: number;
  frameDark: number;
  boardInset: number;
  frameStroke: number;
  frameInner: number;
  cellOdd: number;
  cellEven: number;
  selectGlow: number;

  // panels / nodes / buttons
  panelBg: number;
  panelStroke: number;
  nodeOpen: number;
  nodeOpenDeep: number;
  nodeLocked: number;
  btnPrimaryFrom: number;
  btnPrimaryTo: number;
  btnPrimaryGlow: number;
  btnSecondaryFrom: number;
  btnSecondaryTo: number;
  btnSecondaryGlow: number;

  // text
  heroText: string;
  heroMuted: string;
  titleGlow: string;
  textInk: string;
  textMuted: string;
  chipBg: string;
  chipText: string;
  star: string;
  nodeText: string;
  nodeTextLocked: string;
  btnPrimaryText: string;
  btnSecondaryText: string;
  dangerText: string;
  fxStroke: string;
}

/** Active palette (placeholder values; applyStoredTheme overwrites at startup). Mutated by applyTheme. */
export const Art: Palette = {
  dark: true,
  pageBg:
    'radial-gradient(ellipse at 25% 0%, #34206e 0%, transparent 55%),' +
    'radial-gradient(ellipse at 80% 20%, #1c3a6e 0%, transparent 50%),' +
    'linear-gradient(180deg, #1c1245 0%, #0a081f 100%)',
  skyTop: 0x1c1245,
  skyBottom: 0x0a081f,
  blobA: 0xff4dd2,
  blobB: 0x36d6ff,
  blobC: 0x8a6cff,
  path: 0x3a2f7a,
  frame: 0x261d5c,
  frameDark: 0x171040,
  boardInset: 0x100c2c,
  frameStroke: 0x8a6cff,
  frameInner: 0x36d6ff,
  cellOdd: 0x241c50,
  cellEven: 0x1d1745,
  selectGlow: 0x66e0ff,
  panelBg: 0x1a1442,
  panelStroke: 0x8a6cff,
  nodeOpen: 0xffc94a,
  nodeOpenDeep: 0xe08a18,
  nodeLocked: 0x453e6e,
  btnPrimaryFrom: 0xffe06a,
  btnPrimaryTo: 0xff8a2d,
  btnPrimaryGlow: 0xffc94a,
  btnSecondaryFrom: 0x78e6ff,
  btnSecondaryTo: 0x1482dc,
  btnSecondaryGlow: 0x36d6ff,
  heroText: '#f4f0ff',
  heroMuted: '#a89cd8',
  titleGlow: '#8a6cff',
  textInk: '#f4f0ff',
  textMuted: '#a89cd8',
  chipBg: '#141030d9',
  chipText: '#e8e2ff',
  star: '#ffd24a',
  nodeText: '#3a2408',
  nodeTextLocked: '#b0a8d0',
  btnPrimaryText: '#5a2e04',
  btnSecondaryText: '#04263a',
  dangerText: '#ff7a9a',
  fxStroke: '#3a1a6e',
};

/** Active gem fills (index = gem color 0..5). Mutated by applyTheme. */
export const GEM_FILL: Record<number, GemFill> = {
  0: { main: 0xff3d6e, deep: 0xb1123f, lite: 0xff9ab8 },
  1: { main: 0xff9a2e, deep: 0xc86400, lite: 0xffc98a },
  2: { main: 0xffe03d, deep: 0xd0a400, lite: 0xfff0a0 },
  3: { main: 0x2ee87e, deep: 0x0aa64e, lite: 0x9affc8 },
  4: { main: 0x38b6ff, deep: 0x0a6cd0, lite: 0x9adcff },
  5: { main: 0xc06aff, deep: 0x7a24d8, lite: 0xe0b0ff },
};
