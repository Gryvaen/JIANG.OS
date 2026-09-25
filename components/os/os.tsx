"use client";
import { useEffect, useReducer, useState } from "react";
import type { ContentMode, PublicContent } from "@/domains/content/types";
import type { QuickLink } from "@/domains/quicklinks/types";
import type { AppId, Role } from "@/core/types";
import { isAppAllowedForRole } from "@/core/app-registry";
import { windowReducer } from "@/core/window-reducer";
import { restoreWindows, serializeWindows } from "@/core/window-session";
import { buildAppUrl } from "@/core/url-state";
import { Cover } from "./cover";
import { DesktopShell } from "./desktop-shell";
import { MobileShell } from "./mobile-shell";
import { useUrlBackForward } from "./use-url-back-forward";
const SESSION_KEY = "jiang-os-windows";
export function OS({content,mode,quickLinks,initialApp,initialItem,role}:{content:PublicContent;mode:ContentMode;quickLinks:QuickLink[];initialApp?:AppId;initialItem?:string;role?:Role}){
  const [entered,setEntered]=useState(false);
  const [booting,setBooting]=useState(false);
  const [windows,dispatch]=useReducer(windowReducer,[],()=>typeof window==="undefined"?[]:restoreWindows(sessionStorage.getItem(SESSION_KEY)));
  const [mobileApp,setMobileApp]=useState<{id:AppId|"home";payload?:{item?:string}}>({id:initialApp??"home",payload:initialItem?{item:initialItem}:undefined});
  const openApp=(id:AppId,payload?:{item?:string})=>{
    if(!isAppAllowedForRole(id,role))return;
    if(window.innerWidth<760)setMobileApp({id,payload});
    else dispatch({type:"OPEN",appId:id,viewport:{width:window.innerWidth,height:window.innerHeight},payload});
    const url=buildAppUrl(id,payload);
    if(location.pathname+location.search!==url)history.pushState(null,"",url);
  };
  useUrlBackForward(openApp);
  useEffect(()=>{if(initialApp)openApp(initialApp,initialItem?{item:initialItem}:undefined)},[]);
  const enter=()=>{setBooting(true);setTimeout(()=>{setEntered(true);setBooting(false)},720)};
  useEffect(()=>{if(localStorage.getItem("jiang-os-skip-cover")==="1")setEntered(true)},[]);
  useEffect(()=>{if(initialApp)setEntered(true)},[initialApp]);
  useEffect(()=>{const t=setTimeout(()=>sessionStorage.setItem(SESSION_KEY,serializeWindows(windows)),300);return()=>clearTimeout(t)},[windows]);
  if(!entered)return <Cover onEnter={enter} booting={booting}/>;
  return <main className="os-root"><DesktopShell content={content} mode={mode} windows={windows} dispatch={dispatch} openApp={openApp} quickLinks={quickLinks} role={role}/><MobileShell content={content} mode={mode} active={mobileApp} openApp={id=>setMobileApp({id})} quickLinks={quickLinks} role={role}/></main>;
}
