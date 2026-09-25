"use client";
import { useEffect } from "react";
import { parseAppUrl } from "@/core/url-state";
import type { AppId } from "@/core/types";
export function useUrlBackForward(openApp:(id:AppId,payload?:{item?:string})=>void){
  useEffect(()=>{
    const onPop=()=>{const parsed=parseAppUrl(location.pathname,location.search);if(parsed)openApp(parsed.appId,parsed.item?{item:parsed.item}:undefined)};
    addEventListener("popstate",onPop);
    return()=>removeEventListener("popstate",onPop);
  },[openApp]);
}
