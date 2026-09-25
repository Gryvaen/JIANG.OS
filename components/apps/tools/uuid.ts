export function generateUuids(count:number):string[]{return Array.from({length:Math.max(1,Math.min(count,50))},()=>crypto.randomUUID())}
