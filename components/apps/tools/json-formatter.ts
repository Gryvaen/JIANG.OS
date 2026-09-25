export function formatJson(input:string):{ok:true;output:string}|{ok:false;error:string}{
  try{return {ok:true,output:JSON.stringify(JSON.parse(input),null,2)}}
  catch(e){return {ok:false,error:e instanceof Error?e.message:"Invalid JSON"}}
}
