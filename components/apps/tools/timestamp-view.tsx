"use client";
import { useState } from "react";
import { isoToUnix, unixToIso } from "./timestamp";
export function TimestampTool(){
  const [seconds,setSeconds]=useState("");
  const [iso,setIso]=useState("");
  return <div className="tool-panel">
    <h2>Timestamp</h2>
    <label>Unix seconds<input value={seconds} onChange={e=>setSeconds(e.target.value)} placeholder="1700000000"/></label>
    <p className="tool-result">{seconds?(unixToIso(Number(seconds))??"Invalid"):"—"}</p>
    <label>ISO date<input value={iso} onChange={e=>setIso(e.target.value)} placeholder="2023-11-14T22:13:20.000Z"/></label>
    <p className="tool-result">{iso?(isoToUnix(iso)??"Invalid"):"—"}</p>
  </div>;
}
