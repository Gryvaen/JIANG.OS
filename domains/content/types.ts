export interface Project { id:string; slug:string; title:string; summary:string; status:number; stack:string[]; category:string; featured:boolean; published:boolean; sortOrder:number; links:{label:string;url:string}[] }
export interface Note { id:string; slug:string; title:string; excerpt:string; body:string; published:boolean; publishedAt:string|null }
export interface Profile { name:string; role:string; bio:string; philosophy:string; location:string; links:{label:string;url:string}[] }
export interface PublicContent { projects:Project[]; notes:Note[]; profile:Profile }
export type ContentMode = "live" | "preview" | "unavailable";
export interface LoadedContent { content:PublicContent; mode:ContentMode; error?:string }
