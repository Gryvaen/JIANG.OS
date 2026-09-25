"use client";
import type { InputHTMLAttributes } from "react";
export function Input({label,error,id,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string;error?:string}){return <div className={`ui-field${error?" has-error":""}`}><label htmlFor={id}>{label}</label><input id={id} {...props}/>{error&&<span className="ui-field-error">{error}</span>}</div>}
