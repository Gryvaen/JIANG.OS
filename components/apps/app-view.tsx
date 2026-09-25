"use client";
import type { AppId } from "@/core/types";
import type { PublicContent } from "@/domains/content/types";
import { ProjectsApp } from "./projects-app";
import { GithubApp } from "./github-app";
import { AboutApp } from "./about-app";
import { NotesApp } from "./notes-app";
import { FilesApp } from "./files-app";
import { TerminalApp } from "./terminal-app";
import { SettingsApp } from "./settings-app";
export function AppView({id,content,openApp}:{id:AppId;content:PublicContent;openApp:(id:AppId)=>void}){if(id==="projects")return <ProjectsApp content={content}/>;if(id==="github")return <GithubApp/>;if(id==="about")return <AboutApp content={content}/>;if(id==="notes")return <NotesApp notes={content.notes}/>;if(id==="files")return <FilesApp content={content} openApp={openApp}/>;if(id==="terminal")return <TerminalApp openApp={openApp}/>;return <SettingsApp/>}
