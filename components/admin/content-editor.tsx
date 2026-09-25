"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Note, Project } from "@/domains/content/types";
type Kind = "projects" | "notes";
type Item = (Project | Note) & { kind: Kind };
export function ContentEditor({kind,item,fieldErrors,onCancel,onSubmit}:{kind:Kind;item?:Item;fieldErrors?:Record<string,string[]|undefined>;onCancel:()=>void;onSubmit:(form:FormData)=>void}){
  const [body,setBody]=useState(kind==="notes"?(item as Note|undefined)?.body??"":"");
  const isProject=kind==="projects";
  const project=isProject?(item as Project|undefined):undefined;
  const note=!isProject?(item as Note|undefined):undefined;
  return <form className={`admin-editor${kind==="notes"?" two-col":""}`} action={form=>onSubmit(form)}>
    <input name="title" placeholder="Title" defaultValue={item?.title} required/>
    <input name="slug" placeholder="stable-slug" pattern="[a-z0-9-]+" defaultValue={item?.slug} required/>
    {fieldErrors?.title&&<p className="field-error">{fieldErrors.title.join(", ")}</p>}
    {fieldErrors?.slug&&<p className="field-error">{fieldErrors.slug.join(", ")}</p>}
    <textarea name="summary" placeholder={isProject?"Summary":"Excerpt"} defaultValue={isProject?project?.summary:note?.excerpt} required/>
    {isProject
      ? <input name="category" placeholder="Category" defaultValue={project?.category} required/>
      : <textarea name="body" placeholder="Markdown body" value={body} onChange={e=>setBody(e.target.value)} required/>}
    {!isProject&&<div className="markdown-preview"><ReactMarkdown>{body||"*Preview will appear here.*"}</ReactMarkdown></div>}
    <div><button type="button" onClick={onCancel}>Cancel</button><button type="submit">Save</button></div>
  </form>;
}
