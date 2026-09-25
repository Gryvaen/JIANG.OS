"use client";
import { useRef, type Dispatch, type PointerEvent as ReactPointerEvent } from "react";
import type { WindowState } from "@/core/types";
import type { WindowAction } from "@/core/window-reducer";
const SNAP_THRESHOLD = 24;
export function useWindowDrag(state: WindowState, dispatch: Dispatch<WindowAction>) {
  const start = useRef({ px: 0, py: 0, x: 0, y: 0 });
  const onPointerDown = (e: ReactPointerEvent) => {
    if (state.status === "maximized") return;
    start.current = { px: e.clientX, py: e.clientY, x: state.x, y: state.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const viewport = { width: innerWidth, height: innerHeight };
    dispatch({ type: "MOVE", id: state.instanceId, x: start.current.x + e.clientX - start.current.px, y: start.current.y + e.clientY - start.current.py, viewport });
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    if (state.status === "maximized") return;
    const viewport = { width: innerWidth, height: innerHeight };
    if (e.clientX <= SNAP_THRESHOLD) dispatch({ type: "SNAP", id: state.instanceId, edge: "left", viewport });
    else if (e.clientX >= viewport.width - SNAP_THRESHOLD) dispatch({ type: "SNAP", id: state.instanceId, edge: "right", viewport });
  };
  return { onPointerDown, onPointerMove, onPointerUp };
}
