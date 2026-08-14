import Phaser from 'phaser';
import {
  BOARD_PADDING,
  BoosterId,
  CELL_SIZE,
  GamePhase,
  GoalType,
  ObstacleType,
  SpecialType,
  TOTAL_LEVELS,
} from '../core/constants';
import type { GemColor } from '../core/constants';
import {
  applyResolveToProgress,
  createSession,
  starCount,
} from '../core/level';
import { Rng } from '../core/rng';
import { trySwap } from '../core/resolver';
import { useExtraMoves, useHammer, useShuffle } from '../core/boosters';
import type { CellPos, ResolveResult, SessionState } from '../core/types';
import { getLevel } from '../data/levels';
import { Sfx, specialTextureKey } from '../audio/sfx';
import {
  LocalStorageProgressRepository,
  recordLevelWin,
  type ProgressRepository,
} from '../storage/progress';
import {
  addHudChip,
  drawBoardFrame,
  drawPlaygroundBackdrop,
  ensureThemeTextures,
} from '../art/textures';
import { Art, BODY_FONT, DISPLAY_FONT, GEM_FILL } from '../art/palette';
import { JuiceFx } from '../art/fx';

interface PlayData {
  levelId: number;
}

type GemView = {
  gemId: number;
  sprite: Phaser.GameObjects.Image;
  overlay: Phaser.GameObjects.Image | null;
  baseY: number;
};

export class PlayScene extends Phaser.Scene {
  private session!: SessionState;
  private rng = new Rng();
  private repo: ProgressRepository = new LocalStorageProgressRepository();
  private sfx!: Sfx;
  private fx!: JuiceFx;
  private boardOrigin = { x: 0, y: 0 };
  private gemViews = new Map<number, GemView>();
  private iceViews = new Map<string, Phaser.GameObjects.Image>();
  private selected: CellPos | null = null;
  private inputLocked = false;
  private hammerMode = false;
  private boosterUi = new Map<
    BoosterId,
    {
      root: Phaser.GameObjects.Container;
      slot: Phaser.GameObjects.Image;
      icon: Phaser.GameObjects.Image;
      badge: Phaser.GameObjects.Arc;
      badgeText: Phaser.GameObjects.Text;
    }
  >();
  private aimOverlay: Phaser.GameObjects.Rectangle | null = null;
  private aimBanner: Phaser.GameObjects.GameObject[] = [];
  private hammerRing: Phaser.GameObjects.Image | null = null;
  private timeLeft = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private hud!: {
    moves: Phaser.GameObjects.Text;
    score: Phaser.GameObjects.Text;
    goal: Phaser.GameObjects.Text;
    hint: Phaser.GameObjects.Text;
    goalBar: Phaser.GameObjects.Graphics;
    goalBarRect: { x: number; y: number; w: number; h: number };
  };
  private selectRing!: Phaser.GameObjects.Image;
  private selectGlow!: Phaser.GameObjects.Arc;

  constructor() {
    super('Play');
  }

  init(data: PlayData): void {
    const level = getLevel(Math.min(TOTAL_LEVELS, Math.max(1, data.levelId)));
    this.session = createSession(level);
    this.rng = new Rng(level.id * 1337 + (Date.now() % 10000));
    this.selected = null;
    this.inputLocked = false;
    this.hammerMode = false;
    this.gemViews.clear();
    this.iceViews.clear();
    this.boosterUi.clear();
    this.aimOverlay = null;
    this.aimBanner = [];
    this.hammerRing = null;
    this.timeLeft = level.timeLimitSec ?? 0;
    this.timerEvent = null;
  }

  create(): void {
    const progress = this.repo.load();
    this.sfx = new Sfx(progress.settings.volume);
    this.fx = new JuiceFx(this);
    const { width, height } = this.scale;
    ensureThemeTextures(this);
    const board = this.session.board;
    drawPlaygroundBackdrop(this, width, height, { quiet: true });

    const boardW = board.width * CELL_SIZE;
    const boardH = board.height * CELL_SIZE;
    this.boardOrigin = {
      x: (width - boardW) / 2,
      y: 148,
    };

    drawBoardFrame(
      this,
      this.boardOrigin.x,
      this.boardOrigin.y,
      boardW,
      boardH,
      BOARD_PADDING,
    );

    for (let r = 0; r < board.height; r += 1) {
      for (let c = 0; c < board.width; c += 1) {
        const { x, y } = this.cellToWorld(r, c);
        const key = (r + c) % 2 === 0 ? 'cell-bg' : 'cell-bg-alt';
        this.add.image(x, y, key).setDisplaySize(CELL_SIZE, CELL_SIZE).setDepth(0.5);
      }
    }

    this.selectRing = this.add.image(0, 0, 'select-ring').setVisible(false).setDepth(5);
    this.selectGlow = this.add
      .circle(0, 0, CELL_SIZE * 0.42, Art.selectGlow, 0.25)
      .setVisible(false)
      .setDepth(0.8);
    this.tweens.add({
      targets: this.selectGlow,
      scale: 1.25,
      alpha: 0.08,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.buildTopBar();

    this.buildBoosterButtons();
    this.rebuildBoardViews();
    this.refreshHud();

    if (this.session.level.timeLimitSec) {
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => this.onTimerTick(),
      });
    }

    // Soft ambient sparkles over the board
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        if (this.inputLocked) return;
        const r = Phaser.Math.Between(0, board.height - 1);
        const c = Phaser.Math.Between(0, board.width - 1);
        const { x, y } = this.cellToWorld(r, c);
        const spark = this.add.star(x, y, 4, 1.5, 4, 0xffffff, 0.9).setDepth(4);
        this.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 2,
          y: y - 18,
          duration: 500,
          onComplete: () => spark.destroy(),
        });
      },
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      void this.onPointer(pointer);
    });

    const muted = this.repo.load().settings.volume <= 0.01;
    const mute = this.add
      .text(width - 24, height - 34, muted ? '🔇' : '🔊', {
        fontFamily: BODY_FONT,
        fontSize: '16px',
        color: Art.chipText,
        backgroundColor: Art.chipBg,
        padding: { x: 10, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerup', () => {
      const progress = this.repo.load();
      const nextVolume = progress.settings.volume <= 0.01 ? 0.7 : 0;
      progress.settings.volume = nextVolume;
      this.repo.save(progress);
      this.sfx.setVolume(nextVolume);
      mute.setText(nextVolume > 0 ? '🔊' : '🔇');
      if (nextVolume > 0) this.sfx.tap();
    });
  }

  /**
   * Single-row match-3 HUD: nav on top, then three equal-height chips
   * (moves/timer · goal with bar · score) sharing one baseline.
   */
  private buildTopBar(): void {
    const { width, height } = this.scale;
    const timed = Boolean(this.session.level.timeLimitSec);

    const back = this.add
      .text(16, 28, '← 地图', {
        fontFamily: BODY_FONT,
        fontSize: '14px',
        color: Art.chipText,
        backgroundColor: Art.chipBg,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0, 0.5)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('Map'));

    this.add
      .text(width - 16, 28, `第 ${this.session.level.id} 关`, {
        fontFamily: DISPLAY_FONT,
        fontSize: '15px',
        color: Art.chipText,
        backgroundColor: Art.chipBg,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0.5)
      .setDepth(9);

    const pad = 14;
    const gap = 8;
    const chipY = 50;
    const chipH = 72;
    const sideW = 118;
    const centerW = width - pad * 2 - sideW * 2 - gap * 2;
    const leftX = pad;
    const centerX = leftX + sideW + gap;
    const rightX = centerX + centerW + gap;

    addHudChip(this, leftX, chipY, sideW, chipH);
    addHudChip(this, centerX, chipY, centerW, chipH);
    addHudChip(this, rightX, chipY, sideW, chipH);

    const caption = (x: number, y: number, text: string) =>
      this.add
        .text(x, y, text, {
          fontFamily: BODY_FONT,
          fontSize: '11px',
          color: Art.textMuted,
        })
        .setOrigin(0.5, 0)
        .setDepth(9);

    caption(leftX + sideW / 2, chipY + 8, timed ? '剩余时间' : '剩余步数');
    caption(centerX + centerW / 2, chipY + 8, this.goalCaption());
    caption(rightX + sideW / 2, chipY + 8, '当前分数');

    const moves = this.add
      .text(leftX + sideW / 2, chipY + 28, '', {
        fontFamily: DISPLAY_FONT,
        fontSize: '26px',
        color: Art.textInk,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(9);

    const goal = this.add
      .text(centerX + centerW / 2, chipY + 26, '', {
        fontFamily: DISPLAY_FONT,
        fontSize: '18px',
        color: Art.textInk,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(9);

    const score = this.add
      .text(rightX + sideW / 2, chipY + 28, '', {
        fontFamily: DISPLAY_FONT,
        fontSize: '26px',
        color: Art.textInk,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(9);

    const barPad = 12;
    const barRect = {
      x: centerX + barPad,
      y: chipY + chipH - 16,
      w: centerW - barPad * 2,
      h: 6,
    };
    const goalBar = this.add.graphics().setDepth(9);

    const hint = this.add
      .text(width / 2, height - 136, '', {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: Art.chipText,
        backgroundColor: Art.chipBg,
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(9);

    this.hud = { moves, score, goal, hint, goalBar, goalBarRect: barRect };
  }

  private goalCaption(): string {
    switch (this.session.level.goal.type) {
      case GoalType.BreakIce:
        return '打碎冰块';
      case GoalType.CollectColor:
        return '收集彩珠';
      default:
        return '目标分数';
    }
  }

  private buildBoosterButtons(): void {
    const { width, height } = this.scale;
    const defs: Array<{ id: BoosterId; icon: string; label: string }> = [
      { id: BoosterId.Hammer, icon: 'icon-hammer', label: '锤子' },
      { id: BoosterId.Shuffle, icon: 'icon-shuffle', label: '重排' },
      { id: BoosterId.ExtraMoves, icon: 'icon-moves', label: '+5步' },
    ];
    const gap = 108;
    const startX = width / 2 - gap;
    const y = height - 72;

    defs.forEach((def, i) => {
      const x = startX + i * gap;
      const slot = this.add.image(0, 0, 'booster-slot');
      const icon = this.add.image(0, -1, def.icon);
      const badge = this.add.circle(24, -22, 11, 0xf03848, 1).setStrokeStyle(2, 0xffffff, 0.9);
      const badgeText = this.add
        .text(24, -22, '0', {
          fontFamily: DISPLAY_FONT,
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const label = this.add
        .text(0, 46, def.label, {
          fontFamily: BODY_FONT,
          fontSize: '12px',
          color: Art.chipText,
          backgroundColor: Art.chipBg,
          padding: { x: 8, y: 2 },
        })
        .setOrigin(0.5);

      const root = this.add.container(x, y, [slot, icon, badge, badgeText, label]).setDepth(9);
      root.setSize(76, 76);

      slot.setInteractive({ useHandCursor: true });
      slot.on('pointerdown', () => this.tweens.add({ targets: root, scale: 0.9, duration: 70 }));
      slot.on('pointerup', () => {
        this.tweens.add({ targets: root, scale: 1, duration: 160, ease: 'Back.easeOut' });
        void this.onBooster(def.id);
      });
      slot.on('pointerout', () => this.tweens.add({ targets: root, scale: 1, duration: 120 }));

      // idle breathing to make the bar feel alive
      this.tweens.add({
        targets: icon,
        y: -4,
        duration: 1200 + i * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 200,
      });

      this.boosterUi.set(def.id, { root, slot, icon, badge, badgeText });
    });

    this.refreshBoosterButtons();
  }

  private refreshBoosterButtons(): void {
    const progress = this.repo.load();
    for (const id of Object.values(BoosterId)) {
      const ui = this.boosterUi.get(id);
      if (!ui) continue;
      const count = progress.boosters[id] ?? 0;
      ui.badgeText.setText(String(count));
      ui.badge.setFillStyle(count > 0 ? 0xf03848 : 0x8a8a8a, 1);
      if (count > 0) {
        ui.icon.clearTint();
        ui.slot.setAlpha(1);
        ui.icon.setAlpha(1);
      } else {
        ui.icon.setTint(0x888888);
        ui.slot.setAlpha(0.55);
        ui.icon.setAlpha(0.7);
      }
    }
  }

  /** Toggles hammer aiming mode: dim stage, glow ring, aiming banner. */
  private setHammerMode(on: boolean): void {
    if (this.hammerMode === on) return;
    this.hammerMode = on;
    const { width } = this.scale;
    const ui = this.boosterUi.get(BoosterId.Hammer);

    if (on) {
      this.aimOverlay = this.add
        .rectangle(width / 2, this.scale.height / 2, width, this.scale.height, 0x000000, 0.32)
        .setDepth(0.6);
      if (ui) {
        this.hammerRing = this.add.image(0, 0, 'booster-ring');
        ui.root.addAt(this.hammerRing, 0);
        this.tweens.add({
          targets: this.hammerRing,
          scale: 1.12,
          alpha: 0.5,
          duration: 520,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      // aiming banner above the board
      const by = this.boardOrigin.y - 30;
      const bannerBg = this.add.graphics().setDepth(9);
      bannerBg.fillStyle(Art.panelBg, 0.96);
      bannerBg.fillRoundedRect(width / 2 - 150, by - 18, 300, 36, 18);
      bannerBg.lineStyle(2, Art.selectGlow, 0.9);
      bannerBg.strokeRoundedRect(width / 2 - 150, by - 18, 300, 36, 18);
      const bannerIcon = this.add.image(width / 2 - 122, by, 'icon-hammer').setScale(0.6).setDepth(10);
      const bannerText = this.add
        .text(width / 2 + 12, by, '点击一颗棋子敲碎它 · 再点锤子取消', {
          fontFamily: BODY_FONT,
          fontSize: '13px',
          color: Art.textInk,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(10);
      this.tweens.add({
        targets: bannerIcon,
        angle: -18,
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.aimBanner = [bannerBg, bannerIcon, bannerText];
      // dim the other boosters
      for (const [id, other] of this.boosterUi) {
        if (id !== BoosterId.Hammer) other.root.setAlpha(0.35);
      }
    } else {
      this.aimOverlay?.destroy();
      this.aimOverlay = null;
      if (this.hammerRing) {
        this.tweens.killTweensOf(this.hammerRing);
        this.hammerRing.destroy();
        this.hammerRing = null;
      }
      this.aimBanner.forEach((o) => {
        this.tweens.killTweensOf(o);
        o.destroy();
      });
      this.aimBanner = [];
      for (const [, other] of this.boosterUi) other.root.setAlpha(1);
    }
    this.refreshHud();
  }

  private cellToWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardOrigin.x + col * CELL_SIZE + CELL_SIZE / 2,
      y: this.boardOrigin.y + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  private worldToCell(x: number, y: number): CellPos | null {
    const col = Math.floor((x - this.boardOrigin.x) / CELL_SIZE);
    const row = Math.floor((y - this.boardOrigin.y) / CELL_SIZE);
    const { board } = this.session;
    if (row < 0 || col < 0 || row >= board.height || col >= board.width) return null;
    return { row, col };
  }

  private rebuildBoardViews(): void {
    for (const view of this.gemViews.values()) {
      view.sprite.destroy();
      view.overlay?.destroy();
    }
    this.gemViews.clear();
    for (const ice of this.iceViews.values()) ice.destroy();
    this.iceViews.clear();

    const { board } = this.session;
    for (let r = 0; r < board.height; r += 1) {
      for (let c = 0; c < board.width; c += 1) {
        const cell = board.cells[r]![c]!;
        if (cell.obstacle === ObstacleType.Ice && cell.iceLayers > 0) {
          const { x, y } = this.cellToWorld(r, c);
          const key = cell.iceLayers >= 2 ? 'ice-2' : 'ice-1';
          const img = this.add.image(x, y, key).setDepth(2);
          this.iceViews.set(`${r},${c}`, img);
        }
        if (cell.gem) {
          this.spawnGemView(cell.gem.id, cell.gem.color, cell.gem.special, r, c);
        }
      }
    }
  }

  private spawnGemView(
    gemId: number,
    color: GemColor,
    special: SpecialType,
    row: number,
    col: number,
    fromAbove = false,
    pop = false,
  ): GemView {
    const { x, y } = this.cellToWorld(row, col);
    const startY = fromAbove ? y - CELL_SIZE * (2.4 + Math.random()) : y;
    const sprite = this.add.image(x, startY, `gem-${color}`).setDepth(1);
    let overlay: Phaser.GameObjects.Image | null = null;
    const sk = specialTextureKey(special);
    if (sk) {
      overlay = this.add.image(x, startY, sk).setDepth(1.5);
    }
    const view: GemView = { gemId, sprite, overlay, baseY: y };
    this.gemViews.set(gemId, view);
    const targets = [sprite, overlay].filter(Boolean) as Phaser.GameObjects.GameObject[];
    if (fromAbove) {
      this.tweens.add({
        targets,
        y,
        duration: 280 + Math.random() * 80,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          view.baseY = y;
          this.startIdle(view, gemId);
        },
      });
      // squash on land
      this.tweens.add({
        targets,
        scaleX: 1.12,
        scaleY: 0.88,
        duration: 160,
        delay: 200,
        yoyo: true,
      });
    } else if (pop) {
      sprite.setScale(0);
      overlay?.setScale(0);
      this.tweens.add({
        targets,
        scale: 1,
        duration: 260,
        ease: 'Back.easeOut',
        onComplete: () => this.startIdle(view, gemId),
      });
    } else {
      this.startIdle(view, gemId);
    }
    return view;
  }

  private startIdle(view: GemView, seed: number): void {
    if (this.repo.load().settings.reducedMotion) return;
    this.tweens.add({
      targets: [view.sprite, view.overlay].filter(Boolean),
      y: view.baseY - 3,
      duration: 850 + (seed % 6) * 60,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: (seed % 9) * 50,
    });
  }

  private stopGemTweens(): void {
    for (const view of this.gemViews.values()) {
      this.tweens.killTweensOf(view.sprite);
      if (view.overlay) this.tweens.killTweensOf(view.overlay);
      view.sprite.setScale(1);
      view.overlay?.setScale(1);
      view.sprite.setY(view.baseY);
      view.overlay?.setY(view.baseY);
    }
  }

  private onTimerTick(): void {
    const { progress } = this.session;
    if (progress.phase === GamePhase.Won || progress.phase === GamePhase.Lost) {
      this.timerEvent?.remove();
      this.timerEvent = null;
      return;
    }
    this.timeLeft = Math.max(0, this.timeLeft - 1);
    this.refreshHud();
    if (this.timeLeft > 0 && this.timeLeft <= 5) {
      this.sfx.tick();
      this.fx.shake(0.002, 90);
    }
    // Wait for an in-flight resolve to finish before declaring the loss.
    if (this.timeLeft <= 0 && !this.inputLocked) {
      this.timerEvent?.remove();
      this.timerEvent = null;
      progress.phase = GamePhase.Lost;
      this.checkEnd();
    }
  }

  private refreshHud(): void {
    const { progress, level } = this.session;
    if (level.timeLimitSec) {
      const urgent = this.timeLeft <= 10;
      this.hud.moves.setText(`${this.timeLeft}s`).setColor(urgent ? Art.dangerText : Art.textInk);
    } else {
      this.hud.moves.setText(String(progress.movesLeft)).setColor(Art.textInk);
    }
    this.hud.score.setText(String(progress.score));

    let current = progress.score;
    if (level.goal.type === GoalType.BreakIce) current = progress.iceBroken;
    else if (level.goal.type === GoalType.CollectColor) current = progress.goalProgress;
    this.hud.goal.setText(`${current} / ${level.goal.target}`);

    const ratio = Math.min(1, current / Math.max(1, level.goal.target));
    const { x, y, w, h } = this.hud.goalBarRect;
    const fill = this.hud.goalBar;
    fill.clear();
    fill.fillStyle(Art.panelStroke, 0.28);
    fill.fillRoundedRect(x, y, w, h, 3);
    if (ratio > 0) {
      fill.fillStyle(Art.btnPrimaryGlow, 1);
      fill.fillRoundedRect(x, y, Math.max(6, w * ratio), h, 3);
    }

    this.hud.hint.setText('点两颗相邻彩珠交换').setVisible(!this.hammerMode);
  }

  private showSelect(pos: CellPos): void {
    const { x, y } = this.cellToWorld(pos.row, pos.col);
    this.selectRing.setPosition(x, y).setVisible(true).setScale(0.85);
    this.selectGlow.setPosition(x, y).setVisible(true);
    this.tweens.add({
      targets: this.selectRing,
      scale: 1.08,
      duration: 180,
      yoyo: true,
      ease: 'Back.easeOut',
    });
    const gem = this.session.board.cells[pos.row]![pos.col]!.gem;
    if (gem) {
      const view = this.gemViews.get(gem.id);
      if (view) this.fx.selectPulse(view.sprite);
    }
  }

  private hideSelect(): void {
    this.selectRing.setVisible(false);
    this.selectGlow.setVisible(false);
  }

  private async onPointer(pointer: Phaser.Input.Pointer): Promise<void> {
    if (this.inputLocked) return;
    if (this.session.progress.phase !== GamePhase.Idle) return;
    const pos = this.worldToCell(pointer.x, pointer.y);
    if (!pos) return;

    if (this.hammerMode) {
      await this.applyHammer(pos);
      return;
    }

    this.sfx.tap();
    if (!this.selected) {
      this.selected = pos;
      this.showSelect(pos);
      return;
    }

    const a = this.selected;
    this.selected = null;
    this.hideSelect();

    if (a.row === pos.row && a.col === pos.col) return;

    const adjacent = Math.abs(a.row - pos.row) + Math.abs(a.col - pos.col) === 1;
    if (!adjacent) {
      this.selected = pos;
      this.showSelect(pos);
      return;
    }

    await this.doSwap(a, pos);
  }

  private async doSwap(a: CellPos, b: CellPos): Promise<void> {
    this.inputLocked = true;
    this.stopGemTweens();
    this.sfx.swap();
    await this.animateSwapViews(a, b);

    const result = trySwap(this.session.board, a, b, this.rng);
    if (!result.valid || result.reverted) {
      this.fx.shake(0.003, 100);
      await this.animateSwapViews(a, b);
      this.rebuildBoardViews();
      this.inputLocked = false;
      return;
    }

    if (result.resolve) {
      applyResolveToProgress(
        this.session,
        {
          score: result.resolve.totalScore,
          iceBroken: result.resolve.iceBrokenTotal,
          collectedByColor: result.resolve.collectedByColor,
        },
        true,
      );
      await this.playResolve(result.resolve);
    }

    this.rebuildBoardViews();
    this.refreshHud();
    this.inputLocked = false;
    this.checkEnd();
  }

  private async animateSwapViews(a: CellPos, b: CellPos): Promise<void> {
    const wa = this.cellToWorld(a.row, a.col);
    const wb = this.cellToWorld(b.row, b.col);
    const views = [...this.gemViews.values()];
    const findAt = (wx: number, wy: number) =>
      views.find((v) => Math.abs(v.sprite.x - wx) < 8 && Math.abs(v.sprite.y - wy) < 8);
    const va = findAt(wa.x, wa.y);
    const vb = findAt(wb.x, wb.y);
    const tweens: Promise<void>[] = [];

    const fly = (view: GemView | undefined, toX: number, toY: number, lift: number) => {
      if (!view) return;
      const targets = [view.sprite, view.overlay].filter(Boolean) as Phaser.GameObjects.GameObject[];
      tweens.push(
        new Promise((resolve) => {
          this.tweens.add({
            targets,
            x: toX,
            y: toY - lift,
            scale: 1.12,
            duration: 90,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets,
                x: toX,
                y: toY,
                scale: 1,
                duration: 100,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                  view.baseY = toY;
                  resolve();
                },
              });
            },
          });
        }),
      );
    };

    fly(va, wb.x, wb.y, 10);
    fly(vb, wa.x, wa.y, 10);
    await Promise.all(tweens);
  }

  private destroyView(view: GemView): void {
    this.tweens.killTweensOf(view.sprite);
    if (view.overlay) this.tweens.killTweensOf(view.overlay);
    view.sprite.destroy();
    view.overlay?.destroy();
    this.gemViews.delete(view.gemId);
  }

  private findViewAt(x: number, y: number): GemView | undefined {
    return [...this.gemViews.values()].find(
      (v) => Math.abs(v.sprite.x - x) < 12 && Math.abs(v.sprite.y - y) < 12,
    );
  }

  private async playResolve(resolve: ResolveResult): Promise<void> {
    const reduced = this.repo.load().settings.reducedMotion;
    const colors = Object.values(GEM_FILL).map((g) => g.main);

    for (let i = 0; i < resolve.steps.length; i += 1) {
      const step = resolve.steps[i]!;
      if (i === 0) this.sfx.match(0);
      else this.sfx.cascade(i);

      this.fx.comboBanner(i);

      for (const clear of step.clears) {
        // Dramatic cause FX
        if (clear.cause === 'line' || clear.cause === 'combo') {
          this.fx.flash(0xfff6c8, 0.25, 120);
          this.fx.shake(0.008, 140);
        } else if (clear.cause === 'bomb' || clear.cause === 'colorBomb') {
          this.fx.flash(0xffffff, 0.4, 180);
          this.fx.shake(0.012, 200);
        } else if (i > 0) {
          this.fx.shake(0.005, 100);
        }

        let scoreAnchor: { x: number; y: number } | null = null;
        const clearAnims: Promise<void>[] = [];
        for (const p of clear.positions) {
          const { x, y } = this.cellToWorld(p.row, p.col);
          scoreAnchor = scoreAnchor ?? { x, y };
          const fill = GEM_FILL[(p.row * 3 + p.col) % 6]!.main;
          this.fx.shockwave(x, y, fill, 2.4);
          this.fx.sparkBurst(x, y, fill, reduced ? 6 : 12);

          const view = this.findViewAt(x, y);
          if (!view) continue;
          const targets = [view.sprite, view.overlay].filter(Boolean) as Phaser.GameObjects.GameObject[];
          this.tweens.killTweensOf(view.sprite);
          if (view.overlay) this.tweens.killTweensOf(view.overlay);
          clearAnims.push(
            new Promise<void>((resolveAnim) => {
              this.tweens.add({
                targets,
                scaleX: 1.35,
                scaleY: 1.35,
                duration: reduced ? 40 : 70,
                yoyo: true,
                onComplete: () => {
                  this.tweens.add({
                    targets,
                    scale: 0,
                    alpha: 0,
                    angle: Phaser.Math.Between(-25, 25),
                    duration: reduced ? 70 : 130,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                      this.destroyView(view);
                      resolveAnim();
                    },
                  });
                },
              });
            }),
          );
        }
        await Promise.all(clearAnims);

        if (scoreAnchor) {
          this.fx.floatScore(scoreAnchor.x, scoreAnchor.y - 8, clear.score);
        }
        if (clear.positions.length >= 5) {
          this.fx.confetti(scoreAnchor?.x ?? 0, scoreAnchor?.y ?? 0, colors);
        }
      }

      // Animate falls by gemId
      const fallTweens: Promise<void>[] = [];
      for (const fall of step.falls) {
        const view = this.gemViews.get(fall.gemId);
        if (!view) continue;
        const to = this.cellToWorld(fall.to.row, fall.to.col);
        const targets = [view.sprite, view.overlay].filter(Boolean) as Phaser.GameObjects.GameObject[];
        this.tweens.killTweensOf(view.sprite);
        if (view.overlay) this.tweens.killTweensOf(view.overlay);
        const dist = fall.to.row - fall.from.row;
        fallTweens.push(
          new Promise((resolveFall) => {
            this.tweens.add({
              targets,
              x: to.x,
              y: to.y,
              duration: reduced ? 100 : 120 + dist * 40,
              ease: 'Cubic.easeIn',
              onComplete: () => {
                view.baseY = to.y;
                this.tweens.add({
                  targets,
                  scaleX: 1.15,
                  scaleY: 0.85,
                  duration: 70,
                  yoyo: true,
                  onComplete: () => resolveFall(),
                });
              },
            });
          }),
        );
      }
      await Promise.all(fallTweens);

      // Spawns from top
      for (const spawn of step.spawns) {
        // Prefer real gem id from spawn payload
        this.spawnGemView(
          spawn.gem.id,
          spawn.gem.color,
          spawn.gem.special,
          spawn.pos.row,
          spawn.pos.col,
          true,
        );
      }
      if (step.spawns.length) {
        await this.wait(reduced ? 120 : 260);
      } else {
        await this.wait(reduced ? 40 : 80);
      }

      // Refresh ice visuals lightly
      this.refreshIceViews();
    }

    if (resolve.shuffled) {
      this.sfx.booster();
      this.fx.flash(0xa8e8ff, 0.3, 200);
      this.fx.comboBanner(4);
    }
  }

  private refreshIceViews(): void {
    for (const ice of this.iceViews.values()) ice.destroy();
    this.iceViews.clear();
    const { board } = this.session;
    for (let r = 0; r < board.height; r += 1) {
      for (let c = 0; c < board.width; c += 1) {
        const cell = board.cells[r]![c]!;
        if (cell.obstacle === ObstacleType.Ice && cell.iceLayers > 0) {
          const { x, y } = this.cellToWorld(r, c);
          const key = cell.iceLayers >= 2 ? 'ice-2' : 'ice-1';
          this.iceViews.set(`${r},${c}`, this.add.image(x, y, key).setDepth(2));
        }
      }
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  /** Denied wiggle for an empty booster slot. */
  private wiggleBooster(id: BoosterId): void {
    const ui = this.boosterUi.get(id);
    if (!ui) return;
    this.tweens.add({
      targets: ui.root,
      x: ui.root.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
  }

  private async onBooster(id: BoosterId): Promise<void> {
    if (this.inputLocked || this.session.progress.phase !== GamePhase.Idle) return;
    const progress = this.repo.load();

    if (id !== BoosterId.Hammer && this.hammerMode) this.setHammerMode(false);

    if ((progress.boosters[id] ?? 0) <= 0) {
      this.wiggleBooster(id);
      return;
    }

    if (id === BoosterId.Hammer) {
      this.sfx.tap();
      this.setHammerMode(!this.hammerMode);
      return;
    }

    if (id === BoosterId.Shuffle) {
      const result = useShuffle(progress, this.session.board, this.rng);
      if (!result.ok) return;
      this.repo.save(result.progress);
      this.sfx.booster();
      this.fx.flash(0xffffff, 0.22, 180);
      this.fx.shake(0.004, 140);
      this.rebuildBoardViews();
      this.refreshBoosterButtons();
      return;
    }

    if (id === BoosterId.ExtraMoves) {
      const result = useExtraMoves(progress);
      if (!result.ok) return;
      this.repo.save(result.progress);
      this.session.progress.movesLeft += result.movesAdded ?? 0;
      this.sfx.booster();
      // fly a "+5" from the slot to the moves HUD chip
      const ui = this.boosterUi.get(id);
      if (ui) {
        const flying = this.add
          .text(ui.root.x, ui.root.y - 40, '+5', {
            fontFamily: DISPLAY_FONT,
            fontSize: '26px',
            color: Art.star,
            stroke: Art.fxStroke,
            strokeThickness: 5,
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(40);
        this.tweens.add({
          targets: flying,
          x: this.hud.moves.x,
          y: this.hud.moves.y + 12,
          scale: 0.7,
          duration: 620,
          ease: 'Cubic.easeInOut',
          onComplete: () => {
            flying.destroy();
            this.fx.sparkBurst(this.hud.moves.x, this.hud.moves.y + 12, 0xffd24a, 8);
            this.refreshHud();
          },
        });
      } else {
        this.refreshHud();
      }
      this.refreshBoosterButtons();
    }
  }

  private async applyHammer(pos: CellPos): Promise<void> {
    this.inputLocked = true;
    this.setHammerMode(false);
    this.hideSelect();
    this.stopGemTweens();
    const progress = this.repo.load();
    const result = useHammer(progress, this.session.board, pos, this.rng);
    if (!result.ok || !result.resolve) {
      this.inputLocked = false;
      this.refreshHud();
      return;
    }
    this.repo.save(result.progress);
    this.sfx.booster();
    const { x, y } = this.cellToWorld(pos.row, pos.col);
    this.fx.shockwave(x, y, 0xff8a3d, 3);
    this.fx.sparkBurst(x, y, 0xffd23f, 16);
    applyResolveToProgress(
      this.session,
      {
        score: result.resolve.totalScore,
        iceBroken: result.resolve.iceBrokenTotal,
        collectedByColor: result.resolve.collectedByColor,
      },
      false,
    );
    await this.playResolve(result.resolve);
    this.rebuildBoardViews();
    this.refreshHud();
    this.refreshBoosterButtons();
    this.inputLocked = false;
    this.checkEnd();
  }

  private checkEnd(): void {
    const { progress, level } = this.session;
    // Timer ran out while a resolve was animating.
    if (level.timeLimitSec && this.timeLeft <= 0 && progress.phase === GamePhase.Idle) {
      progress.phase = GamePhase.Lost;
    }
    if (progress.phase !== GamePhase.Idle) {
      this.timerEvent?.remove();
      this.timerEvent = null;
    }
    if (progress.phase === GamePhase.Won) {
      this.sfx.win();
      this.fx.flash(0xfff0a8, 0.35, 280);
      this.fx.confetti(this.scale.width / 2, this.scale.height * 0.4, [
        0xff4d6d, 0xffd23f, 0x3ecf7a, 0x3da9fc, 0xb56bff,
      ]);
      const stars = starCount(progress.score, level.stars);
      const saved = recordLevelWin(this.repo.load(), level.id, stars);
      this.repo.save(saved);
      this.time.delayedCall(650, () => {
        this.scene.start('Result', {
          won: true,
          levelId: level.id,
          score: progress.score,
          stars,
        });
      });
    } else if (progress.phase === GamePhase.Lost) {
      this.sfx.lose();
      this.fx.shake(0.01, 280);
      this.time.delayedCall(500, () => {
        this.scene.start('Result', {
          won: false,
          levelId: level.id,
          score: progress.score,
          stars: 0,
          reason: level.timeLimitSec ? '时间到了' : '步数用完了',
        });
      });
    }
  }
}
