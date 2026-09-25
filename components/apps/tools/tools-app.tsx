"use client";
import { useEffect, useState } from "react";
import { TOOLS } from "./registry";
const STORAGE_KEY="jiang-os-last-tool";
export function ToolsApp({initialToolId}:{initialToolId?:string}){
  const [activeId,setActiveId]=useState(()=>initialToolId ?? (typeof window==="undefined"?TOOLS[0].id:localStorage.getItem(STORAGE_KEY)||TOOLS[0].id));
  useEffect(()=>{localStorage.setItem(STORAGE_KEY,activeId)},[activeId]);
  const active=TOOLS.find(t=>t.id===activeId)??TOOLS[0];
  const Active=active.component;
  return <div className="tools-app">
    <aside>{TOOLS.map(t=><button key={t.id} className={t.id===activeId?"active":""} onClick={()=>setActiveId(t.id)}><t.icon size={16}/><span>{t.name}</span></button>)}</aside>
    <section className="tools-body"><Active/></section>
  </div>;
}
