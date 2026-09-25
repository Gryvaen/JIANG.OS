"use client";
import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import type { QuickLink } from "@/domains/quicklinks/types";
import { buildQuickLinkDraft } from "@/domains/quicklinks/forms";
import { QuickLinkEditor } from "./quick-link-editor";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { SortableRow } from "./sortable-row";
export function QuickLinksManager({quickLinks}:{quickLinks:QuickLink[]}){
  const [items,setItems]=useState<QuickLink[]>(quickLinks);
  const [creating,setCreating]=useState(false);
  const [editing,setEditing]=useState<QuickLink|null>(null);
  const [deleting,setDeleting]=useState<QuickLink|null>(null);
  const [message,setMessage]=useState("");
  const [fieldErrors,setFieldErrors]=useState<Record<string,string[]|undefined>>({});
  const [retry,setRetry]=useState<(()=>void)|null>(null);
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}));

  async function withRetry(action:()=>Promise<void>,failMessage:string){
    try{await action();setRetry(null)}
    catch{setMessage(failMessage);setRetry(()=>()=>withRetry(action,failMessage))}
  }

  function toggle(item:QuickLink){
    return withRetry(async()=>{
      const next=!item.enabled;
      const r=await fetch(`/api/admin/content/quicklinks/${item.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:next})});
      if(!r.ok)throw new Error("toggle failed");
      setItems(v=>v.map(x=>x.id===item.id?{...x,enabled:next}:x));
      setMessage("");
    },"Could not update link.");
  }

  function create(form:FormData){
    return withRetry(async()=>{
      const body=buildQuickLinkDraft(form);
      const r=await fetch("/api/admin/content/quicklinks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok){const data=await r.json().catch(()=>({}));setFieldErrors(data.fieldErrors??{});throw new Error("create failed")}
      const saved=await r.json();
      setItems(v=>[saved,...v]);
      setCreating(false);
      setFieldErrors({});
      setMessage("Link added.");
    },"Could not add link.");
  }

  function update(item:QuickLink,form:FormData){
    return withRetry(async()=>{
      const body=buildQuickLinkDraft(form);
      const r=await fetch(`/api/admin/content/quicklinks/${item.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok){const data=await r.json().catch(()=>({}));setFieldErrors(data.fieldErrors??{});throw new Error("update failed")}
      const saved=await r.json();
      setItems(v=>v.map(x=>x.id===item.id?saved:x));
      setEditing(null);
      setFieldErrors({});
      setMessage("Saved.");
    },"Could not save link.");
  }

  function remove(item:QuickLink){
    return withRetry(async()=>{
      const r=await fetch(`/api/admin/content/quicklinks/${item.id}`,{method:"DELETE"});
      if(!r.ok)throw new Error("delete failed");
      setItems(v=>v.filter(x=>x.id!==item.id));
      setDeleting(null);
      setMessage("Deleted.");
    },"Could not delete link.");
  }

  function onDragEnd(group:string){
    return (e:DragEndEvent)=>{
      const {active,over}=e;
      if(!over||active.id===over.id)return;
      setItems(v=>{
        const groupItems=v.filter(x=>x.groupLabel===group);
        const rest=v.filter(x=>x.groupLabel!==group);
        const fromIndex=groupItems.findIndex(x=>x.id===active.id);
        const toIndex=groupItems.findIndex(x=>x.id===over.id);
        if(fromIndex===-1||toIndex===-1)return v;
        const reordered=[...groupItems];
        const [moved]=reordered.splice(fromIndex,1);
        reordered.splice(toIndex,0,moved);
        withRetry(async()=>{
          const r=await fetch("/api/admin/content/quicklinks/reorder",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({order:reordered.map(x=>x.id)})});
          if(!r.ok)throw new Error("reorder failed");
        },"Could not save new order.");
        return [...rest,...reordered];
      });
    };
  }

  const groups=[...new Set(items.map(x=>x.groupLabel))];

  return <div className="admin-panel">
    <header><h2>Quick Links</h2><div><button onClick={()=>{setCreating(true);setEditing(null)}}>NEW LINK +</button></div></header>
    {message&&<p className="admin-message">{message}{retry&&<button className="admin-retry" onClick={retry}>Retry</button>}</p>}
    {creating&&<QuickLinkEditor fieldErrors={fieldErrors} onCancel={()=>{setCreating(false);setFieldErrors({})}} onSubmit={create}/>}
    {editing&&<QuickLinkEditor item={editing} fieldErrors={fieldErrors} onCancel={()=>{setEditing(null);setFieldErrors({})}} onSubmit={form=>update(editing,form)}/>}

    {groups.map(group=>
      <section key={group}>
        <h3>{group}</h3>
        <DndContext sensors={sensors} onDragEnd={onDragEnd(group)}>
          {items.filter(x=>x.groupLabel===group).map(item=>
            <SortableRow key={item.id} id={item.id}>
              <span>{item.enabled?"ON":"OFF"}</span><b>{item.label}</b><small>{item.url}</small>
              <button onClick={()=>{setEditing(item);setCreating(false)}}>EDIT</button>
              <button onClick={()=>toggle(item)}>{item.enabled?"DISABLE":"ENABLE"}</button>
              <button onClick={()=>setDeleting(item)}>DELETE</button>
            </SortableRow>
          )}
        </DndContext>
      </section>
    )}

    {deleting&&<DeleteConfirmDialog title={deleting.label} onCancel={()=>setDeleting(null)} onConfirm={()=>remove(deleting)}/>}
  </div>;
}
