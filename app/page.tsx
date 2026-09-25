import { OS } from "@/components/os/os";
import { loadPublicContent } from "@/domains/content/service";
export const dynamic="force-dynamic";
export default async function Home(){const {content,mode}=await loadPublicContent();return <OS content={content} mode={mode}/>}
