# 彩珠消消

原创网页三消（玩法同类，非任何商业游戏翻版）。

## 开发

```bash
npm install
npm run dev
npm test
npm run build
```

## 技术

- Vite + TypeScript + Phaser 3
- 棋盘规则在 `src/core/`（可单测，无 Phaser 依赖）
- 本地进度：`src/storage/progress.ts`
