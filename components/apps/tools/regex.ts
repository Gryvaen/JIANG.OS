export function testRegex(pattern:string,flags:string,input:string):{ok:true;matches:string[]}|{ok:false;error:string}{
  try{const re=new RegExp(pattern,flags);return {ok:true,matches:[...input.matchAll(new RegExp(re,re.flags.includes("g")?re.flags:re.flags+"g"))].map(m=>m[0])}}
  catch(e){return {ok:false,error:e instanceof Error?e.message:"Invalid regex"}}
}
