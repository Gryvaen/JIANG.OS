"use client";
import { useState } from "react";
import { decodeBase64, encodeBase64 } from "./base64";
export function Base64Tool(){
  const [plain,setPlain]=useState("");
  const [encoded,setEncoded]=useState("");
  return <div className="tool-panel">
    <h2>Base64</h2>
    <label>Text<textarea value={plain} onChange={e=>setPlain(e.target.value)} rows={4}/></label>
    <p className="tool-result">{plain?encodeBase64(plain):"—"}</p>
    <label>Base64<textarea value={encoded} onChange={e=>setEncoded(e.target.value)} rows={4}/></label>
    <p className="tool-result">{encoded?(decodeBase64(encoded)??"Invalid base64"):"—"}</p>
  </div>;
}
