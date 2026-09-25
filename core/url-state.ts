import { isAppId } from "./app-registry";
import type { AppId } from "./types";
export function buildAppUrl(id:AppId,payload?:{item?:string}):string{
  if(id==="notes"&&payload?.item)return `/notes/${encodeURIComponent(payload.item)}`;
  const params=new URLSearchParams({app:id});
  if(payload?.item)params.set("item",payload.item);
  return `/?${params.toString()}`;
}
export function parseAppUrl(pathname:string,search:string):{appId:AppId;item?:string}|null{
  const noteMatch=pathname.match(/^\/notes\/([^/]+)$/);
  if(noteMatch)return {appId:"notes",item:decodeURIComponent(noteMatch[1])};
  const params=new URLSearchParams(search);
  const app=params.get("app");
  if(app&&isAppId(app))return {appId:app,item:params.get("item")||undefined};
  return null;
}
