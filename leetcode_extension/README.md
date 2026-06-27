# LeetVault — Chrome Extension

Companion Chrome extension for the LeetVault desktop app. Detects the LeetCode
problem you are viewing and saves it to your local desktop app in one click.

## Installation

### 1. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **"Load unpacked"**.
4. Select the `leetcode_extension/` folder.

   - If you installed LeetVault from an installer, the folder ships inside the
     app resources. Open the desktop app's Help view and use the
     "Open extension folder" button to locate it.
   - If you cloned the repo, point Chrome at `leetcode_extension/` in the repo
     root.

The extension shows up in your toolbar. Pin it from the puzzle-piece menu if
you want it always visible.

### 2. Make sure the desktop app is running

The extension talks to the desktop app over `http://localhost:7842`. Launch
LeetVault from your desktop shortcut or start menu before using the popup.

## Usage

1. Navigate to any problem at `leetcode.com/problems/...`.
2. Click the LeetVault icon in the Chrome toolbar.
3. The popup auto-detects:
   - Problem number and title
   - Difficulty (Easy / Medium / Hard)
   - Your current editor code (if any)
   - Tags (preselected as the pattern when one matches)
4. Pick the state (Solved / In Progress / To Review), add notes, and adjust
   the pattern if needed.
5. Click **Save**.

## Connection indicator

The dot in the header reflects the desktop app status:

- Green — connected to the desktop app.
- Red — desktop app is not running.

## AI hint (optional)

Click **AI Hint** for a short approach hint powered by Groq's
`llama-3.1-8b-instant`. The first time you use it the popup asks for a Groq
API key (free tier — get one at <https://console.groq.com/keys>). The key is
stored only in `chrome.storage.local`; the desktop app never sees it.

## Technical notes

- Communicates with `http://localhost:7842` only.
- Permissions are limited to `leetcode.com`, `localhost:7842`, and
  `api.groq.com` (only used if you opt in to AI hints).
- No data is sent to any third-party server beyond the optional Groq call.
