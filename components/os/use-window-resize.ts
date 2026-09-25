"use client";
import { useRef, type Dispatch, type PointerEvent as ReactPointerEvent } from "react";
import type { WindowState } from "@/core/types";
import type { WindowAction } from "@/core/window-reducer";
export function useWindowResize(state: WindowState, dispatch: Dispatch<WindowAction>) {
  const start = useRef({ px: 0, py: 0, width: 0, height: 0 });
  const onPointerDown = (e: ReactPointerEvent) => {
    start.current = { px: e.clientX, py: e.clientY, width: state.width, height: state.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const viewport = { width: innerWidth, height: innerHeight };
    dispatch({ type: "RESIZE", id: state.instanceId, width: start.current.width + e.clientX - start.current.px, height: start.current.height + e.clientY - start.current.py, viewport });
  };
  return { onPointerDown, onPointerMove };
}
