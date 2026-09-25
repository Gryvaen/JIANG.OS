import { notFound } from "next/navigation";
import { OS } from "@/components/os/os";
import { loadPublicContent } from "@/domains/content/service";
import { loadQuickLinks } from "@/domains/quicklinks/service";
export const dynamic="force-dynamic";
export default async function NotePage({params}:{params:Promise<{slug:string}>}){const [{slug},{content,mode},{quickLinks}]=await Promise.all([params,loadPublicContent(),loadQuickLinks()]);if(mode==="live"&&!content.notes.some(n=>n.slug===slug))notFound();return <OS content={content} mode={mode} quickLinks={quickLinks} initialApp="notes" initialItem={slug}/>}
