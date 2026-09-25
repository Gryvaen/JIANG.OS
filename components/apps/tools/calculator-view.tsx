"use client";
import { useState } from "react";
import { evaluateExpression } from "./calculator";
export function CalculatorTool(){
  const [expr,setExpr]=useState("");
  const result=expr?evaluateExpression(expr):null;
  return <div className="tool-panel">
    <h2>Calculator</h2>
    <input value={expr} onChange={e=>setExpr(e.target.value)} placeholder="2 + 2 * (3 - 1)"/>
    <p className="tool-result">{expr?(result===null?"Invalid expression":result):"—"}</p>
  </div>;
}
