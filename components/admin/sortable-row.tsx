"use client";
import type { ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
export function SortableRow({id,children}:{id:string;children:ReactNode}){
  const {attributes,listeners,setNodeRef:setDragRef,transform,isDragging}=useDraggable({id});
  const {setNodeRef:setDropRef,isOver}=useDroppable({id});
  return <div
    ref={node=>{setDragRef(node);setDropRef(node)}}
    className={`admin-row draggable${isOver?" drag-over":""}${isDragging?" dragging":""}`}
    style={{transform:CSS.Translate.toString(transform),opacity:isDragging?.5:1}}
  >
    <span className="admin-drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">⠿</span>
    {children}
  </div>;
}
