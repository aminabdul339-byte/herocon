/**
 * Supplier descriptions can begin with a JSON configuration payload
 * (for example {"styleType":"offer-type-1","usemap":"_sdmap_0"}).
 * Keep genuine seller prose, never render upstream HTML as executable content.
 */
export function cleanSellerDescription(value:string,max=30000):string{
 let s=value.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi," ")
  .replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ")
  .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"')
  .replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");
 for(let attempt=0;attempt<4;attempt++){
  s=s.trimStart();
  if(!s.startsWith("{"))break;
  let depth=0,inQuote=false,escaped=false,end=-1;
  for(let i=0;i<Math.min(s.length,12000);i++){
   const char=s[i];
   if(inQuote){
    if(escaped)escaped=false;
    else if(char==="\\")escaped=true;
    else if(char==='"')inQuote=false;
   }else if(char==='"')inQuote=true;
   else if(char==="{")depth++;
   else if(char==="}"&&--depth===0){end=i;break;}
  }
  if(end===-1)break;
  try{
   const item=JSON.parse(s.slice(0,end+1)) as Record<string,unknown>;
   if(item&&typeof item==="object"&&!Array.isArray(item)&&
      ("styleType" in item||"usemap" in item||"items" in item)&&
      !("product" in item)&&!("description" in item)){
    s=s.slice(end+1);
    continue;
   }
  }catch{}
  break;
 }
 return s.replace(/\s+/g," ").trim().slice(0,max);
}