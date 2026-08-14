import Phaser from 'phaser';
import { GAME_TITLE } from '../core/constants';
import { generateGemTextures, drawPlaygroundBackdrop } from '../art/textures';
import { Art, BODY_FONT, DISPLAY_FONT } from '../art/palette';
import { addThemeButton } from '../ui/themePicker';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateGemTextures(this);
    const { width, height } = this.scale;
    drawPlaygroundBackdrop(this, width, height);
    addThemeButton(this);

    // Showcase gem row with pop-in + bob
    const showcase = [0, 1, 2, 3, 4, 5];
    showcase.forEach((color, i) => {
      const gem = this.add
        .image(width / 2 - 140 + i * 56, height * 0.22, `gem-${color}`)
        .setScale(0)
        .setDepth(2);
      this.tweens.add({
        targets: gem,
        scale: 0.95,
        duration: 420,
        delay: 80 + i * 70,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: gem,
            y: gem.y - 12,
            angle: i % 2 === 0 ? -6 : 6,
            duration: 900 + i * 80,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        },
      });
    });

    // Title entrance
    const title = this.add
      .text(width / 2, height * 0.38, GAME_TITLE, {
        fontFamily: DISPLAY_FONT,
        fontSize: '58px',
        color: Art.heroText,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setScale(0.6)
      .setAlpha(0);
    title.setShadow(0, 0, Art.titleGlow, 18, false, true);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 480,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: title,
          scale: 1.05,
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    this.add
      .text(width / 2, height * 0.48, '甜蜜三消 · 连珠成趣', {
        fontFamily: BODY_FONT,
        fontSize: '18px',
        color: Art.heroMuted,
      })
      .setOrigin(0.5)
      .setDepth(3);

    const btn = this.add.image(width / 2, height * 0.64, 'btn-gold').setDepth(3).setInteractive({
      useHandCursor: true,
    });
    const btnLabel = this.add
      .text(width / 2, height * 0.64 - 2, '开始冒险', {
        fontFamily: DISPLAY_FONT,
        fontSize: '30px',
        color: Art.btnPrimaryText,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.tweens.add({
      targets: [btn, btnLabel],
      scale: 1.06,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Burst sparkles around CTA
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        const spark = this.add
          .star(
            width / 2 + Phaser.Math.Between(-110, 110),
            height * 0.64 + Phaser.Math.Between(-30, 30),
            4,
            2,
            5,
            0xfff6c8,
            1,
          )
          .setDepth(5);
        this.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 0,
          duration: 500,
          onComplete: () => spark.destroy(),
        });
      },
    });

    const go = () => this.scene.start('Map');
    btn.on('pointerup', go);
    btnLabel.setInteractive({ useHandCursor: true }).on('pointerup', go);
  }
}
