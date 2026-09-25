"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
export function DeleteConfirmDialog({title,onCancel,onConfirm}:{title:string;onCancel:()=>void;onConfirm:()=>void}){
  const [value,setValue]=useState("");
  const matches=value===title;
  return <Dialog title="Delete content" onClose={onCancel}>
    <p>Type <b>{title}</b> to confirm deletion. This cannot be undone.</p>
    <input value={value} onChange={e=>setValue(e.target.value)} aria-label="Confirm title" autoFocus/>
    <div className="ui-dialog-actions">
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="danger" disabled={!matches} onClick={onConfirm}>Delete</Button>
    </div>
  </Dialog>;
}
