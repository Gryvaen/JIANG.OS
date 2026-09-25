import { OS } from "@/components/os/os";
import { isAppId } from "@/core/app-registry";
import { loadPublicContent } from "@/domains/content/service";
import { loadQuickLinks } from "@/domains/quicklinks/service";
export const dynamic="force-dynamic";
export default async function Home({searchParams}:{searchParams:Promise<{app?:string;item?:string}>}){const [{content,mode},{quickLinks},{app,item}]=await Promise.all([loadPublicContent(),loadQuickLinks(),searchParams]);const initialApp=app&&isAppId(app)?app:undefined;return <OS content={content} mode={mode} quickLinks={quickLinks} initialApp={initialApp} initialItem={item}/>}
