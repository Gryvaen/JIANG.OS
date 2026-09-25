"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Note } from "@/domains/content/types";
export function NotesApp({notes,payload}:{notes:Note[];payload?:{item?:string}}){const [note,setNote]=useState<Note|null>(()=>payload?.item?notes.find(n=>n.slug===payload.item)??null:null);if(note)return <div className="app-page note"><button className="back" onClick={()=>setNote(null)}><ArrowLeft/> Notes</button><ReactMarkdown>{note.body}</ReactMarkdown></div>;return <div className="app-page"><div className="app-heading"><span>FIELD NOTES</span><h1>Notes</h1></div><div className="notes-list">{notes.map(n=><button key={n.id} onClick={()=>setNote(n)}><time>{n.publishedAt?.slice(0,10)}</time><h2>{n.title}</h2><p>{n.excerpt}</p><span>READ NOTE →</span></button>)}</div></div>}
