export function evaluateExpression(expr:string):number|null{
  const tokens=expr.match(/\d+\.?\d*|[+\-*/()]/g);
  if(!tokens)return null;
  let i=0;
  const peek=()=>tokens[i];
  const parseNum=():number=>{if(peek()==="(")  {i++;const v=parseExpr();if(peek()!==")")throw new Error();i++;return v}const n=Number(peek());if(Number.isNaN(n))throw new Error();i++;return n};
  const parseTerm=():number=>{let v=parseNum();while(peek()==="*"||peek()==="/"){const op=tokens[i++];v=op==="*"?v*parseNum():v/parseNum()}return v};
  const parseExpr=():number=>{let v=parseTerm();while(peek()==="+"||peek()==="-"){const op=tokens[i++];v=op==="+"?v+parseTerm():v-parseTerm()}return v};
  try{const result=parseExpr();return i===tokens.length?result:null}catch{return null}
}
