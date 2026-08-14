import Phaser from 'phaser';
import { BootScene } from './game/BootScene';
import { MapScene } from './game/MapScene';
import { PlayScene } from './game/PlayScene';
import { ResultScene } from './game/ResultScene';
import { applyStoredTheme } from './art/themes';

applyStoredTheme();

const parent = document.getElementById('game-container');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: parent ?? undefined,
  backgroundColor: '#0c0a24',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 512,
    height: 910,
  },
  scene: [BootScene, MapScene, PlayScene, ResultScene],
  audio: {
    disableWebAudio: false,
  },
  input: {
    activePointers: 2,
  },
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
