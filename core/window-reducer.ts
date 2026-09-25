import { getApp } from "./app-registry";
import type { AppId, WindowState } from "./types";
export const TOPBAR_HEIGHT = 44;
type Viewport = { width: number; height: number };
export type WindowAction =
  | { type: "OPEN"; appId: AppId; viewport: Viewport; payload?: { item?: string } }
  | { type: "FOCUS"; id: string }
  | { type: "MOVE"; id: string; x: number; y: number; viewport: Viewport }
  | { type: "RESIZE"; id: string; width: number; height: number; viewport: Viewport }
  | { type: "MINIMIZE"; id: string }
  | { type: "TOGGLE_MAXIMIZE"; id: string; viewport: Viewport }
  | { type: "CLOSE"; id: string }
  | { type: "CYCLE" }
  | { type: "SNAP"; id: string; edge: "left" | "right"; viewport: Viewport };
const top = (s: WindowState[]) => Math.max(0, ...s.map(w => w.zIndex)) + 1;
const clampMove = (x: number, y: number, width: number, height: number, viewport: Viewport) => ({
  x: Math.min(Math.max(0, x), Math.max(0, viewport.width - width)),
  y: Math.min(Math.max(TOPBAR_HEIGHT, y), Math.max(TOPBAR_HEIGHT, viewport.height - height)),
});
const clampSize = (appId: AppId, x: number, y: number, width: number, height: number, viewport: Viewport) => {
  const constraints = getApp(appId).windowConstraints;
  const maxWidth = Math.min(constraints.maxWidth ?? Infinity, viewport.width - x);
  const maxHeight = Math.min(constraints.maxHeight ?? Infinity, viewport.height - y);
  return {
    width: Math.min(Math.max(constraints.minWidth, width), Math.max(constraints.minWidth, maxWidth)),
    height: Math.min(Math.max(constraints.minHeight, height), Math.max(constraints.minHeight, maxHeight)),
  };
};
export function windowReducer(state: WindowState[], action: WindowAction): WindowState[] {
  if (action.type === "OPEN") {
    const existing = state.find(w => w.appId === action.appId);
    if (existing) return state.map(w => w.instanceId === existing.instanceId ? { ...w, status: "open", zIndex: top(state), payload: action.payload ?? existing.payload } : w);
    const app = getApp(action.appId);
    const width = Math.min(app.defaultSize.width, action.viewport.width - 32);
    const height = Math.min(app.defaultSize.height, action.viewport.height - 120);
    const offset = (state.length % 5) * 28;
    return [...state, { instanceId: `${action.appId}-${Date.now()}`, appId: action.appId, x: Math.max(16, (action.viewport.width - width) / 2 + offset), y: Math.max(TOPBAR_HEIGHT + 10, (action.viewport.height - height) / 2 + offset / 2), width, height, status: "open", zIndex: top(state), payload: action.payload }];
  }
  if (action.type === "CLOSE") return state.filter(w => w.instanceId !== action.id);
  if (action.type === "CYCLE") {
    const visible = state.filter(w => w.status !== "minimized").sort((a, b) => b.zIndex - a.zIndex);
    if (visible.length < 2) return state;
    return state.map(w => w.instanceId === visible[1].instanceId ? { ...w, zIndex: top(state) } : w);
  }
  return state.map(w => {
    if (w.instanceId !== action.id) return w;
    if (action.type === "FOCUS") return { ...w, zIndex: top(state) };
    if (action.type === "MOVE") { const { x, y } = clampMove(action.x, action.y, w.width, w.height, action.viewport); return { ...w, x, y, snapped: undefined }; }
    if (action.type === "RESIZE") { const { width, height } = clampSize(w.appId, w.x, w.y, action.width, action.height, action.viewport); return { ...w, width, height, snapped: undefined }; }
    if (action.type === "MINIMIZE") return { ...w, status: "minimized" };
    if (action.type === "TOGGLE_MAXIMIZE") {
      if (w.status === "maximized") return { ...w, ...w.previous, status: "open", previous: undefined };
      return { ...w, previous: { x: w.x, y: w.y, width: w.width, height: w.height }, x: 8, y: TOPBAR_HEIGHT + 4, width: action.viewport.width - 16, height: action.viewport.height - TOPBAR_HEIGHT - 80, status: "maximized", snapped: undefined };
    }
    if (action.type === "SNAP") {
      const width = action.viewport.width / 2;
      const height = action.viewport.height - TOPBAR_HEIGHT;
      const x = action.edge === "left" ? 0 : action.viewport.width - width;
      const previous = w.snapped ? w.previous : { x: w.x, y: w.y, width: w.width, height: w.height };
      return { ...w, previous, x, y: TOPBAR_HEIGHT, width, height, status: "open", snapped: action.edge };
    }
    return w;
  });
}
