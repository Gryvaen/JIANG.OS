"use client";
import { useState } from "react";
import { formatJson } from "./json-formatter";
export function JsonFormatterTool(){
  const [input,setInput]=useState("");
  const result=input?formatJson(input):null;
  return <div className="tool-panel">
    <h2>JSON Formatter</h2>
    <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder='{"hello":"world"}' rows={8}/>
    {result&&(result.ok?<pre className="tool-output">{result.output}</pre>:<p className="tool-error">{result.error}</p>)}
  </div>;
}
