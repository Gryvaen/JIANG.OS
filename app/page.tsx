import { auth } from "@/auth";
import { OS } from "@/components/os/os";
import { isAppId } from "@/core/app-registry";
import { loadPublicContent } from "@/domains/content/service";
import { loadQuickLinks } from "@/domains/quicklinks/service";
export const dynamic="force-dynamic";
export default async function Home({searchParams}:{searchParams:Promise<{app?:string;item?:string}>}){const [{content,mode},{quickLinks},{app,item},session]=await Promise.all([loadPublicContent(),loadQuickLinks(),searchParams,auth()]);const initialApp=app&&isAppId(app)?app:undefined;const role=(session?.user as {role?:"owner"|"viewer"}|undefined)?.role;return <OS content={content} mode={mode} quickLinks={quickLinks} initialApp={initialApp} initialItem={item} role={role}/>}
