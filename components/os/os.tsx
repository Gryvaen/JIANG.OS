"use client";
import { useEffect, useReducer, useState } from "react";
import type { ContentMode, PublicContent } from "@/domains/content/types";
import type { AppId } from "@/core/types";
import { windowReducer } from "@/core/window-reducer";
import { restoreWindows, serializeWindows } from "@/core/window-session";
import { Cover } from "./cover";
import { DesktopShell } from "./desktop-shell";
import { MobileShell } from "./mobile-shell";
const SESSION_KEY = "jiang-os-windows";
export function OS({content,mode}:{content:PublicContent;mode:ContentMode}){const [entered,setEntered]=useState(false);const [booting,setBooting]=useState(false);const [windows,dispatch]=useReducer(windowReducer,[],()=>typeof window==="undefined"?[]:restoreWindows(sessionStorage.getItem(SESSION_KEY)));const [mobileApp,setMobileApp]=useState<AppId|"home">("home");const openApp=(id:AppId)=>{if(window.innerWidth<760)setMobileApp(id);else dispatch({type:"OPEN",appId:id,viewport:{width:window.innerWidth,height:window.innerHeight}})};const enter=()=>{setBooting(true);setTimeout(()=>{setEntered(true);setBooting(false)},720)};useEffect(()=>{if(localStorage.getItem("jiang-os-skip-cover")==="1")setEntered(true)},[]);useEffect(()=>{const t=setTimeout(()=>sessionStorage.setItem(SESSION_KEY,serializeWindows(windows)),300);return()=>clearTimeout(t)},[windows]);if(!entered)return <Cover onEnter={enter} booting={booting}/>;return <main className="os-root"><DesktopShell content={content} mode={mode} windows={windows} dispatch={dispatch} openApp={openApp}/><MobileShell content={content} mode={mode} active={mobileApp} openApp={setMobileApp}/></main>}
