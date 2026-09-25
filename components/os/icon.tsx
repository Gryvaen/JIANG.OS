import { Activity, Diamond, Folder, Github, Link, Lock, Notebook, Server, Settings, Terminal, User, Wrench, type LucideIcon } from "lucide-react";
const icons:Record<string,LucideIcon>={diamond:Diamond,folder:Folder,github:Github,notebook:Notebook,settings:Settings,terminal:Terminal,user:User,link:Link,wrench:Wrench,server:Server,activity:Activity,lock:Lock};
export function AppIcon({name,size=20}:{name:string;size?:number}){const Icon=icons[name]||Diamond;return <Icon size={size} strokeWidth={1.55}/>}
