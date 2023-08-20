import { BrowserWindow } from "electron";
import { join } from "path";
import "./security-restrictions";
import serve from './serve'

if (!import.meta.env.DEV) {
  serve({directory: 'node_modules/web/out'});
}

async function createWindow() {
  const browserWindow = new BrowserWindow({
    show: false, // Use 'ready-to-show' event to show window
    width: 1400,
    height: 800,
    webPreferences: {
      // webviewTag: false, // The webview tag is not recommended. Consider alternatives like iframe or Electron's BrowserView. https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(__dirname, "../../preload/dist/index.cjs"),
    },
  });

  /**
   * If you install `show: true` then it can cause issues when trying to close the window.
   * Use `show: false` and listener events `ready-to-show` to fix these issues.
   *
   * @see https://github.com/electron/electron/issues/25012
   */
  browserWindow.on("ready-to-show", () => {
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    }
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test
   */
  if (import.meta.env.DEV) {
    await browserWindow.loadURL('http://localhost:3333/');
  } else {
    await browserWindow.loadURL('app://-');
  }

  return browserWindow;
}

/**
 * Restore existing BrowserWindow or Create new BrowserWindow
 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
}
