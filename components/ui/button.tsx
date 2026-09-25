"use client";
import type { ButtonHTMLAttributes } from "react";
type Variant = "default" | "primary" | "danger";
export function Button({variant="default",className="",...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:Variant}){return <button className={`ui-button ${variant==="default"?"":variant} ${className}`.trim()} {...props}/>}
