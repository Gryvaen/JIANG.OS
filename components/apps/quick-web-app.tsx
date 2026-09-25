"use client";
import type { QuickLink } from "@/domains/quicklinks/types";
import { AppIcon } from "@/components/os/icon";
export function QuickWebApp({quickLinks}:{quickLinks:QuickLink[]}){
  const groups=[...new Set(quickLinks.map(l=>l.groupLabel))];
  if(!quickLinks.length)return <div className="app-page"><div className="app-heading"><span>QUICK WEB</span><h1>Bookmarks</h1></div><p className="empty-hint">No links yet — add some from the admin panel.</p></div>;
  return <div className="app-page"><div className="app-heading"><span>QUICK WEB</span><h1>Bookmarks</h1></div>
    {groups.map(g=><section className="quick-link-group" key={g}><h3>{g}</h3><div className="quick-link-grid">
      {quickLinks.filter(l=>l.groupLabel===g).map(l=><a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"><AppIcon name={l.icon}/><span>{l.label}</span></a>)}
    </div></section>)}
  </div>;
}
