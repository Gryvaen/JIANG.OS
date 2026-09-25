"use client";
import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import type { Note, Project } from "@/domains/content/types";
import { buildNoteDraft, buildProjectDraft } from "@/domains/content/forms";
import { ContentEditor } from "./content-editor";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { SortableRow } from "./sortable-row";
type Kind = "projects" | "notes";
type Item = (Project | Note) & { kind: Kind };
type FieldErrors = Record<string, string[] | undefined>;
export function ContentManager({projects,notes}:{projects:Project[];notes:Note[]}){
  const [items,setItems]=useState<Item[]>([...projects.map(x=>({...x,kind:"projects" as const})),...notes.map(x=>({...x,kind:"notes" as const}))]);
  const [creating,setCreating]=useState<Kind|null>(null);
  const [editing,setEditing]=useState<Item|null>(null);
  const [deleting,setDeleting]=useState<Item|null>(null);
  const [message,setMessage]=useState("");
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({});
  const [retry,setRetry]=useState<(()=>void)|null>(null);
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}));

  async function withRetry(action:()=>Promise<void>,failMessage:string){
    try{await action();setRetry(null)}
    catch{setMessage(failMessage);setRetry(()=>()=>withRetry(action,failMessage))}
  }

  function toggle(item:Item){
    return withRetry(async()=>{
      const next=!item.published;
      const r=await fetch(`/api/admin/content/${item.kind}/${item.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({published:next})});
      if(!r.ok)throw new Error("toggle failed");
      setItems(v=>v.map(x=>x.id===item.id?{...x,published:next}:x));
      setMessage("");
    },"Could not update content.");
  }

  function create(kind:Kind,form:FormData){
    return withRetry(async()=>{
      const body=kind==="projects"?buildProjectDraft(form):buildNoteDraft(form);
      const r=await fetch(`/api/admin/content/${kind}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok){const data=await r.json().catch(()=>({}));setFieldErrors(data.fieldErrors??{});throw new Error("create failed")}
      const saved=await r.json();
      setItems(v=>[{...saved,kind},...v]);
      setCreating(null);
      setFieldErrors({});
      setMessage("Draft created.");
    },"Could not create draft.");
  }

  function update(item:Item,form:FormData){
    return withRetry(async()=>{
      const draft=item.kind==="projects"?buildProjectDraft(form):buildNoteDraft(form);
      const {published:_omit,...fields}=draft;
      const r=await fetch(`/api/admin/content/${item.kind}/${item.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(fields)});
      if(!r.ok){const data=await r.json().catch(()=>({}));setFieldErrors(data.fieldErrors??{});throw new Error("update failed")}
      const saved=await r.json();
      setItems(v=>v.map(x=>x.id===item.id?{...saved,kind:item.kind}:x));
      setEditing(null);
      setFieldErrors({});
      setMessage("Saved.");
    },"Could not save changes.");
  }

  function remove(item:Item){
    return withRetry(async()=>{
      const r=await fetch(`/api/admin/content/${item.kind}/${item.id}`,{method:"DELETE"});
      if(!r.ok)throw new Error("delete failed");
      setItems(v=>v.filter(x=>x.id!==item.id));
      setDeleting(null);
      setMessage("Deleted.");
    },"Could not delete content.");
  }

  function onDragEnd(e:DragEndEvent){
    const {active,over}=e;
    if(!over||active.id===over.id)return;
    setItems(v=>{
      const projectItems=v.filter(x=>x.kind==="projects");
      const rest=v.filter(x=>x.kind!=="projects");
      const fromIndex=projectItems.findIndex(x=>x.id===active.id);
      const toIndex=projectItems.findIndex(x=>x.id===over.id);
      if(fromIndex===-1||toIndex===-1)return v;
      const reordered=[...projectItems];
      const [moved]=reordered.splice(fromIndex,1);
      reordered.splice(toIndex,0,moved);
      withRetry(async()=>{
        const r=await fetch("/api/admin/content/projects/reorder",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({order:reordered.map(x=>x.id)})});
        if(!r.ok)throw new Error("reorder failed");
      },"Could not save new order.");
      return [...reordered,...rest];
    });
  }

  const projectItems=items.filter(x=>x.kind==="projects");
  const noteItems=items.filter(x=>x.kind==="notes");

  return <div className="admin-panel">
    <header><h2>Content</h2><div><button onClick={()=>{setCreating("projects");setEditing(null)}}>NEW PROJECT +</button><button onClick={()=>{setCreating("notes");setEditing(null)}}>NEW NOTE +</button></div></header>
    {message&&<p className="admin-message">{message}{retry&&<button className="admin-retry" onClick={retry}>Retry</button>}</p>}
    {creating&&<ContentEditor kind={creating} fieldErrors={fieldErrors} onCancel={()=>{setCreating(null);setFieldErrors({})}} onSubmit={form=>create(creating,form)}/>}
    {editing&&<ContentEditor kind={editing.kind} item={editing} fieldErrors={fieldErrors} onCancel={()=>{setEditing(null);setFieldErrors({})}} onSubmit={form=>update(editing,form)}/>}

    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {projectItems.map(item=>
        <SortableRow key={`projects-${item.id}`} id={item.id}>
          <span>PROJECT</span><b>{item.title}</b><small>PROJECTS</small><em>{item.published?"PUBLISHED":"DRAFT"}</em>
          <button onClick={()=>{setEditing(item);setCreating(null)}}>EDIT</button>
          <button onClick={()=>toggle(item)}>{item.published?"UNPUBLISH":"PUBLISH"}</button>
          <button onClick={()=>setDeleting(item)}>DELETE</button>
        </SortableRow>
      )}
    </DndContext>

    {noteItems.map(item=>
      <div className="admin-row" key={`notes-${item.id}`}>
        <span>NOTE</span><b>{item.title}</b><small>NOTES</small><em>{item.published?"PUBLISHED":"DRAFT"}</em>
        <button onClick={()=>{setEditing(item);setCreating(null)}}>EDIT</button>
        <button onClick={()=>toggle(item)}>{item.published?"UNPUBLISH":"PUBLISH"}</button>
        <button onClick={()=>setDeleting(item)}>DELETE</button>
      </div>
    )}

    {deleting&&<DeleteConfirmDialog title={deleting.title} onCancel={()=>setDeleting(null)} onConfirm={()=>remove(deleting)}/>}
  </div>;
}
