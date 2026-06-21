```text
  _                 _   __      __         _  _   
 | |               | |  \ \    / /        | || |  
 | |      ___  ___ | |_  \ \  / /_ _ _   _| || |_ 
 | |     / _ \/ _ \| __|  \ \/ / _` | | | | | __|
 | |____|  __/  __/| |_    \  / (_| | |_| | | |_ 
 |______|\___|\___|\__|     \/ \__,_|\__,_|_|\__|
```                         

Welcome to **LeetVault**, the local-first desktop application designed to supercharge your LeetCode problem-solving journey. 

### What is LeetVault?
LeetVault is a standalone desktop companion that tracks, manages, and optimizes your LeetCode practice. Instead of relying on manual spreadsheets or third-party cloud trackers, LeetVault runs completely locally. It pairs with a browser extension, seamlessly capturing your completed problems and submissions in real-time, right from your browser, while keeping your data entirely in your own hands.

### Key Functionalities
* **Seamless Browser Integration:** Runs a lightweight local server (`localhost:7842`) to silently catch submissions and metadata sent from the LeetVault browser extension.
* **Spaced Repetition Learning:** Implements the SM-2 spaced repetition algorithm (similar to Anki) to surface the right problems for review at the optimal time, cementing algorithmic patterns in your memory.
* **100% Local & Private:** Your progress is stored locally in a highly performant SQLite database (`leetcode.db`). No accounts, no cloud syncs, no subscription fees. 
* **True Cross-Platform:** Available and natively optimized for Windows, macOS (x64 & Apple Silicon), and Linux (AppImage & deb). It smartly migrates and manages your database location based on your OS.
* **Legacy Compatible:** Fully preserves the existing `leetcode.db` schema and extension HTTP wire format from v1 (`leetcode_tracker`), ensuring a smooth upgrade path.

### The Tech Stack
LeetVault v2 is a complete rewrite built on a modern, robust foundation:
* **Core & Windowing:** Electron
* **UI Interface:** React + Vite (for lightning-fast HMR)
* **Language:** End-to-end TypeScript
* **Database:** `better-sqlite3`
* **Testing:** Vitest
* **Packaging:** `electron-builder` (NSIS, DMG, AppImage)

---
*For developer setup, build scripts, and local environment configurations, please see the [src/README.md](./src/README.md).*