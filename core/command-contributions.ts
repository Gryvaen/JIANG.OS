import type { AppDefinition, CommandResult, SystemCommand } from "./types";
const externalSearch=(label:string,keywords:string[],urlFor:(q:string)=>string)=>(app:AppDefinition):SystemCommand=>({
  id:`${app.id}.${keywords[0]}`,label:`Search ${label}`,keywords,appId:app.id,
  execute:(_ctx,args):CommandResult=>{
    const q=args.join(" ");
    if(!q)return {ok:false,output:`Usage: ${keywords[0]} <query>`};
    return {ok:true,output:`Searching ${label} for "${q}"…`,openUrl:urlFor(q)};
  }
});
export const commandContributions: Partial<Record<AppDefinition["id"], (app: AppDefinition) => SystemCommand[]>> = {
  web:(app)=>[
    externalSearch("YouTube",["yt","youtube"],q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`)(app),
    externalSearch("GitHub",["gh","github"],q=>`https://github.com/search?q=${encodeURIComponent(q)}`)(app),
    externalSearch("the web",["search"],q=>`https://www.google.com/search?q=${encodeURIComponent(q)}`)(app)
  ],
  tools:(app)=>[{
    id:"tools.translate",label:"Translate",keywords:["translate","translator"],appId:app.id,
    execute:(_ctx,args):CommandResult=>{
      const text=args.join(" ");
      if(!text)return {ok:false,output:"Usage: translate <text>"};
      // No server Provider Adapter exists yet (per roadmap 3.1/3.3) — MVP stub opens
      // Google Translate pre-filled instead of calling a translation API.
      return {ok:true,output:"Translator isn't connected to a server provider yet — opening Google Translate instead.",openUrl:`https://translate.google.com/?text=${encodeURIComponent(text)}`};
    }
  }],
  servers:(app)=>[{
    id:"servers.status",label:"Servers status",keywords:["servers","status"],appId:app.id,
    execute:(ctx,args):CommandResult=>{
      ctx.openApp(app.id);
      const query=args.join(" ");
      return {ok:true,output:query?`Opening Servers — look for "${query}"…`:"Opening Servers status…"};
    }
  }]
};
