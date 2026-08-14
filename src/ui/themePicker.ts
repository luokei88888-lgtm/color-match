import Phaser from 'phaser';
import { Art, BODY_FONT, DISPLAY_FONT } from '../art/palette';
import { applyTheme, getActiveTheme, saveThemeId, THEME_ORDER, THEMES } from '../art/themes';

/**
 * Theme entry chip (top-right) + modal picker, shared by Boot and Map.
 * Selecting a theme persists it, re-skins the palette and restarts the scene.
 */
export function addThemeButton(scene: Phaser.Scene): void {
  const { width } = scene.scale;
  const btn = scene.add
    .text(width - 16, 40, `🎨 ${getActiveTheme().name}`, {
      fontFamily: BODY_FONT,
      fontSize: '14px',
      color: Art.chipText,
      backgroundColor: Art.chipBg,
      padding: { x: 10, y: 6 },
    })
    .setOrigin(1, 0.5)
    .setDepth(80)
    .setInteractive({ useHandCursor: true });
  btn.on('pointerup', () => openThemePicker(scene));
}

export function openThemePicker(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const overlay: Phaser.GameObjects.GameObject[] = [];

  const scrim = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
    .setDepth(90)
    .setInteractive();
  overlay.push(scrim);

  const panelW = 340;
  const rowH = 76;
  const panelH = 96 + THEME_ORDER.length * rowH;
  const px = width / 2 - panelW / 2;
  const py = height / 2 - panelH / 2;

  const panel = scene.add.graphics().setDepth(91);
  panel.fillStyle(Art.panelBg, 0.98);
  panel.fillRoundedRect(px, py, panelW, panelH, 22);
  panel.lineStyle(3, Art.panelStroke, 0.9);
  panel.strokeRoundedRect(px, py, panelW, panelH, 22);
  overlay.push(panel);

  overlay.push(
    scene.add
      .text(width / 2, py + 34, '选择美术主题', {
        fontFamily: DISPLAY_FONT,
        fontSize: '24px',
        color: Art.textInk,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(92),
  );

  const close = () => overlay.forEach((o) => o.destroy());
  scrim.on('pointerup', close);

  THEME_ORDER.forEach((id, i) => {
    const theme = THEMES[id];
    const active = theme.id === getActiveTheme().id;
    const ry = py + 68 + i * rowH;

    const row = scene.add.graphics().setDepth(92);
    row.fillGradientStyle(
      theme.palette.skyTop,
      theme.palette.skyTop,
      theme.palette.skyBottom,
      theme.palette.skyBottom,
      1,
    );
    row.fillRoundedRect(px + 16, ry, panelW - 32, rowH - 12, 14);
    if (active) {
      row.lineStyle(3, Art.selectGlow, 1);
      row.strokeRoundedRect(px + 16, ry, panelW - 32, rowH - 12, 14);
    }
    overlay.push(row);

    overlay.push(
      scene.add
        .text(px + 32, ry + 16, theme.name + (active ? ' ✓' : ''), {
          fontFamily: DISPLAY_FONT,
          fontSize: '18px',
          color: theme.palette.heroText,
          fontStyle: 'bold',
        })
        .setDepth(93),
    );
    overlay.push(
      scene.add
        .text(px + 32, ry + 42, theme.tagline, {
          fontFamily: BODY_FONT,
          fontSize: '12px',
          color: theme.palette.heroMuted,
        })
        .setDepth(93),
    );

    theme.gems.slice(0, 4).forEach((gem, gi) => {
      overlay.push(
        scene.add
          .circle(px + panelW - 100 + gi * 20, ry + (rowH - 12) / 2, 7, gem.fill.main, 1)
          .setStrokeStyle(1.5, 0xffffff, 0.7)
          .setDepth(93),
      );
    });

    const hit = scene.add
      .rectangle(px + 16 + (panelW - 32) / 2, ry + (rowH - 12) / 2, panelW - 32, rowH - 12, 0xffffff, 0.001)
      .setDepth(94)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => {
      if (theme.id === getActiveTheme().id) {
        close();
        return;
      }
      saveThemeId(theme.id);
      applyTheme(theme.id);
      scene.scene.restart();
    });
    overlay.push(hit);
  });
}
