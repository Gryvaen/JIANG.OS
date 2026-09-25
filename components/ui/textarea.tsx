"use client";
import type { TextareaHTMLAttributes } from "react";
export function Textarea({label,error,id,...props}:TextareaHTMLAttributes<HTMLTextAreaElement>&{label:string;error?:string}){return <div className={`ui-field${error?" has-error":""}`}><label htmlFor={id}>{label}</label><textarea id={id} {...props}/>{error&&<span className="ui-field-error">{error}</span>}</div>}
