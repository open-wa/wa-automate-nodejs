---
'@open-wa/stickers': patch
---

- 🐛 Make `createSticker()` manage warm renderers and idle cleanup automatically, queue bursts before loading inputs, and recover individual failed workers without stalling later jobs.
- ⚡️ Process standalone jobs with a small CPU-aware worker pool and yield during browser effects to keep the page responsive.
