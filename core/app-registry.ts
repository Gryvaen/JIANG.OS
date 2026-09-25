import type { AppDefinition, AppId } from "./types";
const DEFAULT_WINDOW_CONSTRAINTS = { minWidth: 420, minHeight: 300 };
export const APP_REGISTRY: AppDefinition[] = [
  {id:"projects",name:"Projects",shortName:"Projects",category:"PERSONAL",description:"Selected work and experiments",icon:"diamond",keywords:["portfolio","work","risc-v"],shells:["desktop","mobile"],defaultSize:{width:760,height:560},singleton:true,windowConstraints:DEFAULT_WINDOW_CONSTRAINTS,access:"public",searchIndexable:true},
  {id:"github",name:"GitHub",shortName:"GitHub",category:"PERSONAL",description:"Repositories and activity",icon:"github",keywords:["code","repos"],shells:["desktop","mobile"],defaultSize:{width:620,height:520},singleton:true,windowConstraints:DEFAULT_WINDOW_CONSTRAINTS,access:"public",searchIndexable:true},
  {id:"about",name:"About Jiang",shortName:"About",category:"PERSONAL",description:"Profile and philosophy",icon:"user",keywords:["whoami","profile"],shells:["desktop","mobile"],defaultSize:{width:600,height:500},singleton:true,windowConstraints:DEFAULT_WINDOW_CONSTRAINTS,access:"public",searchIndexable:true},
  {id:"notes",name:"Notes",shortName:"Notes",category:"PERSONAL",description:"Published field notes",icon:"notebook",keywords:["writing","markdown"],shells:["desktop","mobile"],defaultSize:{width:680,height:540},singleton:true,windowConstraints:DEFAULT_WINDOW_CONSTRAINTS,access:"public",searchIndexable:true},
  {id:"files",name:"Files",shortName:"Files",category:"SYSTEM",description:"JIANG.OS virtual filesystem",icon:"folder",keywords:["finder","vfs"],shells:["desktop","mobile"],defaultSize:{width:700,height:500},singleton:true,windowConstraints:DEFAULT_WINDOW_CONSTRAINTS,access:"public",searchIndexable:true},
  {id:"terminal",name:"Terminal",shortName:"Terminal",category:"SYSTEM",description:"jiangsh command interface",icon:"terminal",keywords:["shell","cli"],shells:["desktop","mobile"],defaultSize:{width:720,height:460},singleton:true,windowConstraints:DEFAULT_WINDOW_CONSTRAINTS,access:"public",searchIndexable:false},
  {id:"settings",name:"Settings",shortName:"Settings",category:"SYSTEM",description:"Appearance and behavior",icon:"settings",keywords:["theme","accent","wallpaper"],shells:["desktop","mobile"],defaultSize:{width:640,height:520},singleton:true,windowConstraints:DEFAULT_WINDOW_CONSTRAINTS,access:"public",searchIndexable:false}
];
export const getApp = (id: AppId) => APP_REGISTRY.find(app => app.id === id)!;
export const isAppId = (value: string): value is AppId => APP_REGISTRY.some(app => app.id === value);
