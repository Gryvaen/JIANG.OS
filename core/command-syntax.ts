const SYNTAX_PREFIXES=["open","search","yt","youtube","gh","github","translate","translator"] as const;
export function parseCommandPrefix(input:string):{prefix:string;rest:string}|null{
  const trimmed=input.trim();
  const [first,...rest]=trimmed.split(/\s+/);
  const prefix=first?.toLowerCase();
  if(!prefix||!rest.length)return null;
  if(!(SYNTAX_PREFIXES as readonly string[]).includes(prefix))return null;
  return {prefix,rest:rest.join(" ")};
}
