/**
 * @module preload
 */

import { contextBridge } from "electron";

// Expose version number to renderer
contextBridge.exposeInMainWorld("yerba", { version: 0.1 });
