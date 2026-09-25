import { isAppId } from "./app-registry";
import type { WindowState } from "./types";
export function serializeWindows(state: WindowState[]): string {
  return JSON.stringify(state);
}
export function restoreWindows(raw: string | null): WindowState[] {
  if (!raw) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw) } catch { return [] }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((w): w is WindowState =>
    !!w && typeof w === "object" &&
    typeof (w as WindowState).instanceId === "string" &&
    isAppId((w as WindowState).appId) &&
    typeof (w as WindowState).x === "number" &&
    typeof (w as WindowState).y === "number" &&
    typeof (w as WindowState).width === "number" &&
    typeof (w as WindowState).height === "number" &&
    typeof (w as WindowState).zIndex === "number" &&
    ["open", "minimized", "maximized"].includes((w as WindowState).status)
  );
}
