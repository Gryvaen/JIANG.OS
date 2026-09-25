"use client";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { PublicContent } from "@/domains/content/types";
export function AboutApp({content}:{content:PublicContent}){const p=content.profile;return <div className="app-page about"><span className="eyebrow">ABOUT / WHOAMI</span><h1>{p.name}<br/><em>BUILDING SYSTEMS.</em></h1><p className="lead">{p.bio}</p><blockquote>“{p.philosophy}”</blockquote><div className="about-meta"><span><MapPin/> {p.location}</span>{p.links.map(l=><a href={l.url} key={l.label} target="_blank">{l.label} <ArrowUpRight/></a>)}</div></div>}
