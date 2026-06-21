// Test-only stub. Real implementation calls Electron's BrowserWindow.webContents.send,
// which can't run without an Electron runtime.
export function broadcast(_channel: unknown, _payload: unknown): void {
  /* no-op */
}
