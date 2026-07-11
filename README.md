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

---

## Installing Unsigned Releases

LeetVault installers aren't code-signed (code-signing certs cost $99–400/year). Your OS will warn you the first time. It's safe to bypass — here's how:

### Windows
When SmartScreen shows "Windows protected your PC":
1. Click **More info**
2. Click **Run anyway**

### macOS
If you see "LeetVault is damaged and can't be opened" or "cannot be opened because the developer cannot be verified":
1. Open **Terminal**
2. Run: `xattr -cr /Applications/LeetVault.app`
3. Launch the app normally

Alternatively: right-click the app → **Open** → **Open** in the dialog (works only for the "unverified developer" warning, not the "damaged" one).

### Linux
No warnings — AppImage and `.deb` just work.