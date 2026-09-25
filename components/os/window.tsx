"use client";
import type { Dispatch } from "react";
import { Maximize2, Minus, X } from "lucide-react";
import { getApp } from "@/core/app-registry";
import type { AppId, WindowState } from "@/core/types";
import type { WindowAction } from "@/core/window-reducer";
import type { PublicContent } from "@/domains/content/types";
import type { QuickLink } from "@/domains/quicklinks/types";
import { AppView } from "@/components/apps/app-view";
import { AppIcon } from "./icon";
import { useWindowDrag } from "./use-window-drag";
import { useWindowResize } from "./use-window-resize";
export function Window({state,dispatch,content,openApp,quickLinks,windowCount}:{state:WindowState;dispatch:Dispatch<WindowAction>;content:PublicContent;openApp:(id:AppId)=>void;quickLinks:QuickLink[];windowCount?:number}){const app=getApp(state.appId);const drag=useWindowDrag(state,dispatch);const resize=useWindowResize(state,dispatch);return <article className={`window ${state.status}${state.snapped?" snap-preview":""}`} style={{left:state.x,top:state.y,width:state.width,height:state.height,zIndex:state.zIndex}} onMouseDown={()=>dispatch({type:"FOCUS",id:state.instanceId})}><header onPointerDown={drag.onPointerDown} onPointerMove={drag.onPointerMove} onPointerUp={drag.onPointerUp}><div><AppIcon name={app.icon} size={15}/><span>{app.name.toUpperCase()}</span></div><nav><button onClick={()=>dispatch({type:"MINIMIZE",id:state.instanceId})} aria-label="Minimize"><Minus/></button><button onClick={()=>dispatch({type:"TOGGLE_MAXIMIZE",id:state.instanceId,viewport:{width:innerWidth,height:innerHeight}})} aria-label="Maximize"><Maximize2/></button><button onClick={()=>dispatch({type:"CLOSE",id:state.instanceId})} aria-label="Close"><X/></button></nav></header><div className="window-body"><AppView id={state.appId} content={content} openApp={openApp} quickLinks={quickLinks} payload={state.payload} windowCount={windowCount}/></div>{state.status!=="maximized"&&<button className="resize-handle" aria-label="Resize window" onPointerDown={resize.onPointerDown} onPointerMove={resize.onPointerMove}/>}</article>}
