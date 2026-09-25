"use client";
import { useState } from "react";
import { generateUuids } from "./uuid";
export function UuidTool(){
  const [count,setCount]=useState(1);
  const [ids,setIds]=useState<string[]>([]);
  return <div className="tool-panel">
    <h2>UUID Generator</h2>
    <label>Count<input type="number" min={1} max={50} value={count} onChange={e=>setCount(Number(e.target.value))}/></label>
    <button onClick={()=>setIds(generateUuids(count))}>Generate</button>
    <pre className="tool-output">{ids.join("\n")}</pre>
  </div>;
}
