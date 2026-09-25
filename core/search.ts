import { APP_REGISTRY, isAppAllowedForRole } from "./app-registry";
import { commands } from "./commands";
import type { CommandContext, CommandResult, Role } from "./types";
import type { Note, Project } from "@/domains/content/types";
import type { QuickLink } from "@/domains/quicklinks/types";

export type SearchResultType = "app" | "project" | "note" | "command" | "quicklink";
export interface SearchResult { id:string; type:SearchResultType; title:string; subtitle:string; icon:string; score:number; execute:(ctx:CommandContext)=>CommandResult }
export interface SearchIndexData { projects:Project[]; notes:Note[]; quickLinks:QuickLink[]; role?:Role }
export interface SearchProvider { id:SearchResultType; search:(q:string,data:SearchIndexData)=>SearchResult[] }

const score=(text:string,q:string):number=>{const t=text.toLowerCase();const i=t.indexOf(q);if(i===-1)return 0;return i===0?100-t.length*0.1:60-i};

export const appProvider:SearchProvider={id:"app",search:(q,data)=>APP_REGISTRY.filter(a=>a.searchIndexable!==false&&isAppAllowedForRole(a.id,data.role)&&(a.name+a.description+a.keywords.join(" ")).toLowerCase().includes(q)).map(a=>({id:`app-${a.id}`,type:"app",title:a.name,subtitle:a.description,icon:a.icon,score:score(a.name,q)+10,execute:ctx=>{ctx.openApp(a.id);return {ok:true,output:`Opening ${a.name}…`}}}))};

export const commandProvider:SearchProvider={id:"command",search:(q,data)=>commands.filter(c=>(!c.appId||isAppAllowedForRole(c.appId,data.role))&&(c.label+c.keywords.join(" ")).toLowerCase().includes(q)).map(c=>({id:`cmd-${c.id}`,type:"command",title:c.label,subtitle:"Command",icon:"terminal",score:score(c.label,q),execute:ctx=>c.execute(ctx,[])}))};

export const projectProvider:SearchProvider={id:"project",search:(q,data)=>data.projects.filter(p=>(p.title+p.summary+p.category).toLowerCase().includes(q)).map(p=>({id:`project-${p.id}`,type:"project",title:p.title,subtitle:p.category,icon:"diamond",score:score(p.title,q),execute:ctx=>{ctx.openApp("projects",{item:p.slug});return {ok:true,output:`Opening ${p.title}…`}}}))};

export const noteProvider:SearchProvider={id:"note",search:(q,data)=>data.notes.filter(n=>(n.title+n.excerpt).toLowerCase().includes(q)).map(n=>({id:`note-${n.id}`,type:"note",title:n.title,subtitle:"Note",icon:"notebook",score:score(n.title,q),execute:ctx=>{ctx.openApp("notes",{item:n.slug});return {ok:true,output:`Opening ${n.title}…`}}}))};

export const quickLinkProvider:SearchProvider={id:"quicklink",search:(q,data)=>data.quickLinks.filter(l=>(l.label+l.keywords.join(" ")).toLowerCase().includes(q)).map(l=>({id:`link-${l.id}`,type:"quicklink",title:l.label,subtitle:l.groupLabel,icon:l.icon,score:score(l.label,q),execute:()=>({ok:true,output:`Opening ${l.label}…`,openUrl:l.url})}))};

export const SEARCH_PROVIDERS:SearchProvider[]=[appProvider,projectProvider,noteProvider,quickLinkProvider,commandProvider];

export function runSearch(query:string,data:SearchIndexData):SearchResult[]{
  const q=query.trim().toLowerCase();
  return SEARCH_PROVIDERS.flatMap(p=>p.search(q,data)).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,30);
}
