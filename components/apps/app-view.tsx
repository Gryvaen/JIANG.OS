"use client";
import type { AppId } from "@/core/types";
import type { PublicContent } from "@/domains/content/types";
import type { QuickLink } from "@/domains/quicklinks/types";
import { ProjectsApp } from "./projects-app";
import { GithubApp } from "./github-app";
import { AboutApp } from "./about-app";
import { NotesApp } from "./notes-app";
import { FilesApp } from "./files-app";
import { TerminalApp } from "./terminal-app";
import { SettingsApp } from "./settings-app";
import { QuickWebApp } from "./quick-web-app";
import { ToolsApp } from "./tools/tools-app";
import { ServersApp } from "./servers-app";
import { MonitorApp } from "./monitor-app";
export function AppView({id,content,openApp,quickLinks,payload,windowCount}:{id:AppId;content:PublicContent;openApp:(id:AppId)=>void;quickLinks:QuickLink[];payload?:{item?:string};windowCount?:number}){if(id==="projects")return <ProjectsApp content={content} payload={payload}/>;if(id==="github")return <GithubApp/>;if(id==="about")return <AboutApp content={content}/>;if(id==="notes")return <NotesApp notes={content.notes} payload={payload}/>;if(id==="files")return <FilesApp content={content} openApp={openApp}/>;if(id==="terminal")return <TerminalApp openApp={openApp}/>;if(id==="web")return <QuickWebApp quickLinks={quickLinks}/>;if(id==="tools")return <ToolsApp initialToolId={payload?.item}/>;if(id==="servers")return <ServersApp payload={payload}/>;if(id==="monitor")return <MonitorApp windowCount={windowCount}/>;return <SettingsApp/>}
