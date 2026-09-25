"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previouslyFocused=document.activeElement as HTMLElement|null;
    const node=ref.current;
    const focusable=()=>node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')??[];
    focusable()[0]?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();onClose();return}
      if(e.key==="Tab"){
        const els=Array.from(focusable());
        if(!els.length)return;
        const first=els[0],last=els[els.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    };
    addEventListener("keydown",key);
    return()=>{removeEventListener("keydown",key);previouslyFocused?.focus()};
  },[onClose]);
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="ui-dialog" role="dialog" aria-modal="true" aria-label={title} ref={ref}><h2>{title}</h2>{children}</div></div>;
}
