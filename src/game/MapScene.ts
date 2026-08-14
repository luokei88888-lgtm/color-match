import Phaser from 'phaser';
import { GAME_TITLE, TOTAL_LEVELS } from '../core/constants';
import { LEVELS } from '../data/levels';
import {
  LocalStorageProgressRepository,
  type ProgressRepository,
} from '../storage/progress';
import { drawPlaygroundBackdrop, ensureThemeTextures } from '../art/textures';
import { Art, BODY_FONT, DISPLAY_FONT } from '../art/palette';
import { addThemeButton } from '../ui/themePicker';

export class MapScene extends Phaser.Scene {
  private repo: ProgressRepository = new LocalStorageProgressRepository();

  constructor() {
    super('Map');
  }

  create(): void {
    ensureThemeTextures(this);
    const progress = this.repo.load();
    const { width, height } = this.scale;
    drawPlaygroundBackdrop(this, width, height);

    this.drawHeaderBanner(width);

    addThemeButton(this);

    const back = this.add
      .text(16, 40, '← 首页', {
        fontFamily: BODY_FONT,
        fontSize: '14px',
        color: Art.chipText,
        backgroundColor: Art.chipBg,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0, 0.5)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('Boot'));

    // Winding path ribbon
    const path = this.add.graphics().setDepth(0);
    path.lineStyle(18, Art.path, 0.9);
    path.beginPath();
    path.moveTo(width * 0.18, 140);
    for (let i = 0; i < 6; i += 1) {
      const y = 140 + i * 90;
      const x = i % 2 === 0 ? width * 0.18 : width * 0.82;
      path.lineTo(x, y);
      if (i < 5) {
        path.lineTo(i % 2 === 0 ? width * 0.82 : width * 0.18, y + 90);
      }
    }
    path.strokePath();

    const cols = 5;
    const startY = 150;
    const gapX = (width - 48) / cols;
    const gapY = 82;

    for (let i = 0; i < TOTAL_LEVELS; i += 1) {
      const level = LEVELS[i]!;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 24 + gapX * col + gapX / 2;
      const y = startY + row * gapY;
      const unlocked = level.id <= progress.maxUnlocked;
      const stars = progress.stars[i] ?? 0;

      const node = this.add
        .image(x, y, unlocked ? 'node-open' : 'node-locked')
        .setDepth(2)
        .setScale(0.9);

      if (unlocked) {
        node.setInteractive({ useHandCursor: true });
        node.on('pointerup', () => this.scene.start('Play', { levelId: level.id }));
        node.on('pointerover', () => node.setScale(1.02));
        node.on('pointerout', () => node.setScale(0.9));
      }

      this.add
        .text(x, y - 2, String(level.id), {
          fontFamily: DISPLAY_FONT,
          fontSize: '18px',
          color: unlocked ? Art.nodeText : Art.nodeTextLocked,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(3);

      const starStr = unlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '🔒';
      this.add
        .text(x, y + 30, starStr, {
          fontFamily: BODY_FONT,
          fontSize: '12px',
          color: unlocked ? Art.star : Art.nodeTextLocked,
        })
        .setOrigin(0.5)
        .setDepth(3);

      if (level.timeLimitSec) {
        this.add
          .text(x + 20, y - 18, '⏱', { fontFamily: BODY_FONT, fontSize: '14px' })
          .setOrigin(0.5)
          .setDepth(3);
      }
    }

    this.add
      .text(width / 2, height - 36, `已解锁 ${progress.maxUnlocked} / ${TOTAL_LEVELS}`, {
        fontFamily: BODY_FONT,
        fontSize: '14px',
        color: Art.chipText,
        backgroundColor: Art.chipBg,
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(4);
  }

  /** Ribbon-style header banner with glowing frame and flanking gems. */
  private drawHeaderBanner(width: number): void {
    const bw = 244;
    const bh = 74;
    const bx = width / 2 - bw / 2;
    const by = 30;
    const midY = by + bh / 2;

    const g = this.add.graphics().setDepth(1);

    // ribbon tails, folded behind the plate
    g.fillStyle(Art.frameDark, 0.95);
    for (const dir of [-1, 1] as const) {
      const edge = dir === -1 ? bx : bx + bw;
      g.fillPoints(
        [
          new Phaser.Geom.Point(edge, by + 16),
          new Phaser.Geom.Point(edge + dir * 34, by + 16),
          new Phaser.Geom.Point(edge + dir * 22, midY),
          new Phaser.Geom.Point(edge + dir * 34, by + bh - 16),
          new Phaser.Geom.Point(edge, by + bh - 16),
        ],
        true,
      );
    }

    // drop shadow + plate
    g.fillStyle(0x000000, Art.dark ? 0.35 : 0.18);
    g.fillRoundedRect(bx + 3, by + 6, bw, bh, 20);
    g.fillStyle(Art.panelBg, 0.97);
    g.fillRoundedRect(bx, by, bw, bh, 20);
    // glowing double stroke
    g.lineStyle(6, Art.panelStroke, 0.18);
    g.strokeRoundedRect(bx - 2, by - 2, bw + 4, bh + 4, 22);
    g.lineStyle(2.5, Art.panelStroke, 0.95);
    g.strokeRoundedRect(bx, by, bw, bh, 20);
    // top gloss
    g.fillStyle(0xffffff, Art.dark ? 0.07 : 0.35);
    g.fillRoundedRect(bx + 10, by + 6, bw - 20, 18, 9);

    // flanking gems inside the plate, gently bobbing
    const gemL = this.add.image(bx + 30, midY, 'gem-0').setScale(0.55).setDepth(2);
    const gemR = this.add.image(bx + bw - 30, midY, 'gem-4').setScale(0.55).setDepth(2);
    [gemL, gemR].forEach((gem, i) => {
      this.tweens.add({
        targets: gem,
        y: midY - 4,
        angle: i === 0 ? -8 : 8,
        duration: 1100 + i * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // sparkles on the corners
    [
      { x: bx + 6, y: by + 4 },
      { x: bx + bw - 6, y: by + bh - 4 },
    ].forEach((p, i) => {
      const spark = this.add.image(p.x, p.y, 'star-dot').setDepth(3).setScale(0.8);
      this.tweens.add({
        targets: spark,
        alpha: 0.15,
        angle: 45,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        delay: i * 500,
        ease: 'Sine.easeInOut',
      });
    });

    const title = this.add
      .text(width / 2, by + 26, GAME_TITLE, {
        fontFamily: DISPLAY_FONT,
        fontSize: '29px',
        color: Art.textInk,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);
    title.setShadow(0, 0, Art.titleGlow, 10, false, true);

    this.add
      .text(width / 2, by + 56, '·  选 择 关 卡  ·', {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: Art.textMuted,
      })
      .setOrigin(0.5)
      .setDepth(3);
  }
}
