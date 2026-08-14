import Phaser from 'phaser';
import { Art, DISPLAY_FONT } from './palette';

const COMBO_LINES = ['Nice!', 'Great!', 'Awesome!', 'Incredible!', 'UNSTOPPABLE!'];

/** Runtime VFX helpers — rings, bursts, banners, shake. */
export class JuiceFx {
  constructor(private readonly scene: Phaser.Scene) {}

  private reduced(): boolean {
    return false;
  }

  shockwave(x: number, y: number, color = 0xfff6c8, maxScale = 3.2): void {
    const ring = this.scene.add
      .circle(x, y, 18, color, 0)
      .setStrokeStyle(5, color, 0.95)
      .setDepth(20);
    this.scene.tweens.add({
      targets: ring,
      scale: maxScale,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  sparkBurst(x: number, y: number, color: number, count = 14): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const dist = Phaser.Math.Between(28, 70);
      const star = this.scene.add
        .star(x, y, 4, 2, 6, color, 1)
        .setDepth(21)
        .setAngle(Phaser.Math.Between(0, 360));
      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 10,
        alpha: 0,
        scale: 0.2,
        angle: star.angle + Phaser.Math.Between(90, 240),
        duration: Phaser.Math.Between(280, 480),
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  confetti(x: number, y: number, colors: number[]): void {
    for (let i = 0; i < 18; i += 1) {
      const c = colors[i % colors.length]!;
      const p = this.scene.add
        .rectangle(x, y, Phaser.Math.Between(5, 9), Phaser.Math.Between(8, 14), c, 1)
        .setDepth(22)
        .setAngle(Phaser.Math.Between(0, 360));
      this.scene.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-90, 90),
        y: y + Phaser.Math.Between(-40, 120),
        alpha: 0,
        angle: p.angle + Phaser.Math.Between(120, 400),
        duration: Phaser.Math.Between(450, 750),
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  floatScore(x: number, y: number, score: number): void {
    const t = this.scene.add
      .text(x, y, `+${score}`, {
        fontFamily: DISPLAY_FONT,
        fontSize: '22px',
        color: '#fff8ef',
        stroke: Art.fxStroke,
        strokeThickness: 5,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.scene.tweens.add({
      targets: t,
      y: y - 56,
      alpha: 0,
      scale: 1.35,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  comboBanner(cascadeIndex: number): void {
    if (cascadeIndex <= 0) return;
    const { width, height } = this.scene.scale;
    const label = COMBO_LINES[Math.min(cascadeIndex, COMBO_LINES.length) - 1]!;
    const t = this.scene.add
      .text(width / 2, height * 0.42, label, {
        fontFamily: DISPLAY_FONT,
        fontSize: cascadeIndex >= 3 ? '48px' : '36px',
        color: '#fff4c8',
        stroke: Art.fxStroke,
        strokeThickness: 8,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setScale(0.4)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: t,
      scale: 1.15,
      alpha: 1,
      duration: 180,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 220,
      onComplete: () => t.destroy(),
    });
  }

  flash(color = 0xffffff, alpha = 0.35, duration = 160): void {
    const { width, height } = this.scene.scale;
    const g = this.scene.add.rectangle(width / 2, height / 2, width, height, color, alpha).setDepth(50);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration,
      onComplete: () => g.destroy(),
    });
  }

  lineBeam(horizontal: boolean, rowOrCol: number, origin: { x: number; y: number }, cell: number, span: number): void {
    const length = span * cell;
    const beam = this.scene.add
      .rectangle(
        horizontal ? origin.x + length / 2 - cell / 2 : origin.x + rowOrCol * cell + cell / 2,
        horizontal ? origin.y + rowOrCol * cell + cell / 2 : origin.y + length / 2 - cell / 2,
        horizontal ? length : 10,
        horizontal ? 10 : length,
        0xfff6a0,
        0.95,
      )
      .setDepth(18)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: beam,
      alpha: 1,
      scaleX: horizontal ? 1 : 1.8,
      scaleY: horizontal ? 1.8 : 1,
      duration: 90,
      yoyo: true,
      hold: 60,
      onComplete: () => beam.destroy(),
    });
  }

  shake(intensity = 0.006, duration = 160): void {
    if (this.reduced()) return;
    this.scene.cameras.main.shake(duration, intensity);
  }

  selectPulse(target: Phaser.GameObjects.GameObject): void {
    this.scene.tweens.add({
      targets: target,
      scale: 1.18,
      duration: 160,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  idleBob(targets: Phaser.GameObjects.GameObject[], index: number): void {
    this.scene.tweens.add({
      targets,
      y: '-=3',
      duration: 900 + (index % 5) * 70,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: (index % 8) * 60,
    });
  }

  popIn(targets: Phaser.GameObjects.GameObject[]): void {
    targets.forEach((t) => {
      const any = t as Phaser.GameObjects.Image;
      if ('setScale' in any) any.setScale(0);
    });
    this.scene.tweens.add({
      targets,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
    });
  }
}
