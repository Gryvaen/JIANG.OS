"use client";
import { useState } from "react";
import { buildQrDataUrl } from "./qr-code";
export function QrCodeTool(){
  const [text,setText]=useState("");
  const dataUrl=text?buildQrDataUrl(text):null;
  return <div className="tool-panel">
    <h2>QR Code</h2>
    <input value={text} onChange={e=>setText(e.target.value)} placeholder="Text or URL"/>
    {dataUrl&&<img src={dataUrl} alt="QR code" className="tool-qr"/>}
  </div>;
}
