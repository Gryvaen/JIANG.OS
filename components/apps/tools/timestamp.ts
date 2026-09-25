export function unixToIso(seconds:number):string|null{const d=new Date(seconds*1000);return Number.isNaN(d.getTime())?null:d.toISOString()}
export function isoToUnix(iso:string):number|null{const d=new Date(iso);return Number.isNaN(d.getTime())?null:Math.floor(d.getTime()/1000)}
