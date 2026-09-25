import { X } from "lucide-react";
import { appsForRole } from "@/core/app-registry";
import type { AppId, Role } from "@/core/types";
import { AppIcon } from "./icon";
export function Launcher({openApp,close,role}:{openApp:(id:AppId)=>void;close:()=>void;role?:Role}){const apps=appsForRole(role);return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="launcher"><header><div><span>APPLICATIONS</span><h2>Open your world.</h2></div><button onClick={close}><X/></button></header>{(["SYSTEM","PERSONAL"] as const).map(cat=><div className="launcher-group" key={cat}><h3>{cat}</h3><div>{apps.filter(a=>a.category===cat).map(app=><button key={app.id} onClick={()=>openApp(app.id)}><AppIcon name={app.icon} size={25}/><span><b>{app.name}</b><small>{app.description}</small></span></button>)}</div></div>)}</section></div>}
