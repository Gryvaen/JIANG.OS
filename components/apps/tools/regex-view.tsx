"use client";
import { useState } from "react";
import { testRegex } from "./regex";
export function RegexTool(){
  const [pattern,setPattern]=useState("");
  const [flags,setFlags]=useState("g");
  const [input,setInput]=useState("");
  const result=pattern?testRegex(pattern,flags,input):null;
  return <div className="tool-panel">
    <h2>Regex Tester</h2>
    <div className="tool-row"><input value={pattern} onChange={e=>setPattern(e.target.value)} placeholder="pattern"/><input value={flags} onChange={e=>setFlags(e.target.value)} placeholder="flags" style={{maxWidth:80}}/></div>
    <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="test string" rows={5}/>
    {result&&(result.ok?<pre className="tool-output">{result.matches.length?result.matches.join("\n"):"No matches"}</pre>:<p className="tool-error">{result.error}</p>)}
  </div>;
}
