"use client";
import type { QuickLink } from "@/domains/quicklinks/types";
export function QuickLinkEditor({item,fieldErrors,onCancel,onSubmit}:{item?:QuickLink;fieldErrors?:Record<string,string[]|undefined>;onCancel:()=>void;onSubmit:(form:FormData)=>void}){
  return <form className="admin-editor" action={form=>onSubmit(form)}>
    <input name="label" placeholder="Label" defaultValue={item?.label} required/>
    <input name="url" type="url" placeholder="https://…" defaultValue={item?.url} required/>
    {fieldErrors?.url&&<p className="field-error">{fieldErrors.url.join(", ")}</p>}
    <input name="icon" placeholder="Icon name (lucide)" defaultValue={item?.icon??"link"}/>
    <input name="groupLabel" placeholder="Group (e.g. Development)" defaultValue={item?.groupLabel??"General"} required/>
    <input name="keywords" placeholder="Search aliases, comma separated" defaultValue={item?.keywords.join(", ")}/>
    <div><button type="button" onClick={onCancel}>Cancel</button><button type="submit">Save</button></div>
  </form>;
}
