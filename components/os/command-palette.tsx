"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { APP_REGISTRY } from "@/core/app-registry";
import type { AppId } from "@/core/types";
import { AppIcon } from "./icon";
export function CommandPalette({openApp,close}:{openApp:(id:AppId)=>void;close:()=>void}){const [q,setQ]=useState("");const results=useMemo(()=>APP_REGISTRY.filter(a=>(a.name+a.description+a.keywords.join(" ")).toLowerCase().includes(q.toLowerCase())),[q]);return <div className="overlay palette-overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="palette"><label><Search/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search JIANG.OS…" onKeyDown={e=>{if(e.key==="Enter"&&results[0])openApp(results[0].id)}}/><kbd>ESC</kbd></label><p>{q?"RESULTS":"SUGGESTED"}</p>{results.map(app=><button key={app.id} onClick={()=>openApp(app.id)}><AppIcon name={app.icon}/><span>{app.name}<small>{app.description}</small></span><kbd>OPEN</kbd></button>)}</section></div>}
