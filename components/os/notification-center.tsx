"use client";
import { AlertTriangle, X } from "lucide-react";
import type { AppId } from "@/core/types";
import type { IncidentView } from "@/domains/servers/types";
function relativeTime(iso: string | null) { if (!iso) return "never"; const diff = (Date.now() - new Date(iso).getTime()) / 1000; if (diff < 60) return `${Math.floor(diff)}s ago`; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago` }
export function NotificationCenter({incidents,openApp,onMarkRead,onMarkAll,close}:{incidents:IncidentView[];openApp:(id:AppId,payload?:{item?:string})=>void;onMarkRead:(id:string)=>void;onMarkAll:()=>void;close:()=>void}){
  const hasUnread=incidents.some(i=>!i.readAt);
  const jump=(i:IncidentView)=>{if(!i.readAt)onMarkRead(i.id);openApp("servers",{item:i.serverId});close()};
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}>
    <section className="notification-center">
      <header><b>Notifications</b><div>{hasUnread&&<button onClick={onMarkAll}>Mark all read</button>}<button onClick={close} aria-label="Close"><X size={16}/></button></div></header>
      {!incidents.length
        ? <p className="empty-hint">No notifications.</p>
        : <div className="notification-list">{incidents.map(i=><button key={i.id} className={i.readAt?"":"unread"} onClick={()=>jump(i)}>
            <AlertTriangle size={16}/>
            <span><b>{i.title}</b><small>{i.status==="open"?`opened ${relativeTime(i.openedAt)}`:`resolved ${relativeTime(i.resolvedAt)}`}</small></span>
          </button>)}</div>}
    </section>
  </div>;
}
