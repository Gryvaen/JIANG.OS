"use client";
import type { ReactNode } from "react";
export function Panel({title,actions,children}:{title?:string;actions?:ReactNode;children:ReactNode}){return <section className="ui-panel">{title&&<header><h2>{title}</h2>{actions}</header>}{children}</section>}
