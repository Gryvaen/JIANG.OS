const buckets=new Map<string,{count:number;windowStart:number}>();
export function rateLimit(key:string,limit:number,windowMs:number,now:number=Date.now()):boolean{
  const bucket=buckets.get(key);
  if(!bucket||now-bucket.windowStart>windowMs){buckets.set(key,{count:1,windowStart:now});return true}
  if(bucket.count>=limit)return false;
  bucket.count++;
  return true;
}
