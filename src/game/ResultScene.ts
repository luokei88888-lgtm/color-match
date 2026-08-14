import Phaser from 'phaser';
import { TOTAL_LEVELS } from '../core/constants';
import { drawPlaygroundBackdrop } from '../art/textures';
import { Art, BODY_FONT, DISPLAY_FONT } from '../art/palette';

interface ResultData {
  won: boolean;
  levelId: number;
  score: number;
  stars: number;
  reason?: string;
}

export class ResultScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.result = data;
  }

  create(): void {
    const { width, height } = this.scale;
    drawPlaygroundBackdrop(this, width, height);

    const card = this.add.graphics().setDepth(2);
    card.fillStyle(0x000000, 0.12);
    card.fillRoundedRect(width / 2 - 150 + 3, height * 0.22 + 6, 300, 380, 28);
    card.fillStyle(Art.panelBg, 0.97);
    card.fillRoundedRect(width / 2 - 150, height * 0.22, 300, 380, 28);
    card.lineStyle(3, Art.panelStroke, 0.85);
    card.strokeRoundedRect(width / 2 - 150, height * 0.22, 300, 380, 28);

    this.add
      .text(width / 2, height * 0.3, this.result.won ? '过关啦！' : '再试一次', {
        fontFamily: DISPLAY_FONT,
        fontSize: '40px',
        color: this.result.won ? Art.textInk : Art.dangerText,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(width / 2, height * 0.38, `第 ${this.result.levelId} 关 · ${this.result.score} 分`, {
        fontFamily: BODY_FONT,
        fontSize: '18px',
        color: Art.textMuted,
      })
      .setOrigin(0.5)
      .setDepth(3);

    if (!this.result.won && this.result.reason) {
      this.add
        .text(width / 2, height * 0.45, this.result.reason, {
          fontFamily: BODY_FONT,
          fontSize: '16px',
          color: Art.dangerText,
        })
        .setOrigin(0.5)
        .setDepth(3);
    }

    if (this.result.won) {
      const stars = this.add
        .text(
          width / 2,
          height * 0.46,
          '★'.repeat(this.result.stars) + '☆'.repeat(3 - this.result.stars),
          {
            fontFamily: DISPLAY_FONT,
            fontSize: '36px',
            color: Art.star,
          },
        )
        .setOrigin(0.5)
        .setDepth(3);
      this.tweens.add({
        targets: stars,
        scale: 1.12,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Celebrate gems
      [0, 2, 4].forEach((c, i) => {
        const g = this.add.image(width / 2 - 70 + i * 70, height * 0.54, `gem-${c}`).setDepth(3).setScale(0.85);
        this.tweens.add({
          targets: g,
          y: g.y - 8,
          duration: 800 + i * 100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });
    }

    const retryImg = this.add.image(width / 2, height * 0.64, 'btn-mint').setDepth(3).setInteractive({
      useHandCursor: true,
    });
    const retry = this.add
      .text(width / 2, height * 0.64 - 2, '再玩一局', {
        fontFamily: DISPLAY_FONT,
        fontSize: '22px',
        color: Art.btnSecondaryText,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    const retryGo = () => this.scene.start('Play', { levelId: this.result.levelId });
    retryImg.on('pointerup', retryGo);
    retry.on('pointerup', retryGo);

    const map = this.add
      .text(width / 2, height * 0.74, '返回地图', {
        fontFamily: BODY_FONT,
        fontSize: '17px',
        color: Art.textMuted,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });
    map.on('pointerup', () => this.scene.start('Map'));

    if (this.result.won && this.result.levelId < TOTAL_LEVELS) {
      const nextImg = this.add.image(width / 2, height * 0.84, 'btn-gold').setDepth(3).setScale(0.85).setInteractive({
        useHandCursor: true,
      });
      const next = this.add
        .text(width / 2, height * 0.84 - 2, '下一关 →', {
          fontFamily: DISPLAY_FONT,
          fontSize: '20px',
          color: Art.btnPrimaryText,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(4)
        .setInteractive({ useHandCursor: true });
      const nextGo = () => this.scene.start('Play', { levelId: this.result.levelId + 1 });
      nextImg.on('pointerup', nextGo);
      next.on('pointerup', nextGo);
    }

    void retryImg;
  }
}
