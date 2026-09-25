import { Diamond, Folder, Github, Notebook, Settings, Terminal, User, type LucideIcon } from "lucide-react";
const icons:Record<string,LucideIcon>={diamond:Diamond,folder:Folder,github:Github,notebook:Notebook,settings:Settings,terminal:Terminal,user:User};
export function AppIcon({name,size=20}:{name:string;size?:number}){const Icon=icons[name]||Diamond;return <Icon size={size} strokeWidth={1.55}/>}
