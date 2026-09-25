"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { executeCommand } from "@/core/commands";
import { parseCommandPrefix } from "@/core/command-syntax";
import { runSearch, type SearchIndexData } from "@/core/search";
import type { AppId, CommandContext, CommandResult } from "@/core/types";
import { AppIcon } from "./icon";
export function CommandPalette({data,openApp,close}:{data:SearchIndexData;openApp:(id:AppId,payload?:{item?:string})=>void;close:()=>void}){
  const [q,setQ]=useState("");
  const ctx:CommandContext={openApp,setTheme:()=>{}};
  const syntax=useMemo(()=>parseCommandPrefix(q),[q]);
  const results=useMemo(()=>runSearch(q,data),[q,data]);
  const run=(result:CommandResult)=>{if(result.openUrl)window.open(result.openUrl,"_blank","noopener,noreferrer");close()};
  return <div className="overlay palette-overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}>
    <section className="palette">
      <label><Search/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search or type a command…" onKeyDown={e=>{if(e.key!=="Enter")return;if(syntax)run(executeCommand(q,ctx));else if(results[0])run(results[0].execute(ctx))}}/><kbd>ESC</kbd></label>
      {syntax
        ? <button className="palette-syntax-row" onClick={()=>run(executeCommand(q,ctx))}><span>RUN</span><b>{q}</b></button>
        : <>
          <p>{q?"RESULTS":"SUGGESTED"}</p>
          {results.map(r=><button key={r.id} onClick={()=>run(r.execute(ctx))}><AppIcon name={r.icon}/><span>{r.title}<small>{r.subtitle}</small></span><kbd>{r.type.toUpperCase()}</kbd></button>)}
        </>}
    </section>
  </div>;
}
