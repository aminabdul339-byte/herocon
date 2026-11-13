import type{Product,Variant}from"./types";
export const productId=(p:Product)=>p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||"";
export const productPrice=(p:Product)=>p.price||(p.priceGBP!=null?`£${p.priceGBP.toFixed(2)}`:"Price unavailable");
const noise=/\b(?:cross[- ]border|hot[- ]selling|wholesale|factory supply|amazon|aliexpress|temu|wish|same style|new style|in stock|big brand|high quality|premium quality|fashion trendy|new arrival|best seller|popular|202[0-9]\s*(?:new|autumn|winter|spring|summer)?)\b/gi;
const filler=/\b(?:men'?s and women'?s|for men and women|male and female|with high quality|latest design|new fashion|free shipping)\b/gi;
export function cleanTitle(p:Product){
  const raw=(p.displayTitle?.trim()||p.title||"").trim();
  let title=raw.replace(/[【\[][^\]】]*[\]】]/g," ")
    .replace(/\b(?:SKU|style|model|item)\s*(?:no\.?|number|#|:)?\s*[A-Z0-9-]{5,}\b/gi," ")
    .replace(noise," ").replace(filler," ")
    .replace(/[!|*_]+/g," ").replace(/\s*[,;:]\s*/g," ")
    .replace(/\s+/g," ").replace(/^[\s,.:;/-]+|[\s,.:;/-]+$/g,"").trim();
  title=title.replace(/^(?:(?:cabinet|batch|stock)\s*\d+\s*)+/i,"").trim();
  const words=title.split(/\s+/).filter(Boolean);
  if(!words.length||/^image\s*\d+$/i.test(title)||title.length<4)return p.category?p.category+" product":"Product";
  const short=words.slice(0,8).join(" ");
  const summary=short.length>70?short.slice(0,70).replace(/\s+\S*$/,""):short;
  const result=summary||words.slice(0,5).join(" ");
  return result.charAt(0).toUpperCase()+result.slice(1);
}
export function imagesFor(p:Product){const urls=[p.imageUrl,...(p.images||[])].filter((x):x is string=>Boolean(x)&&/^https?:\/\//.test(x as string));const seen=new Set<string>();return urls.filter(u=>{const k=u.split("?")[0];if(seen.has(k))return false;seen.add(k);return true})}
export function variantsFor(p:Product):Variant[]{return(p.variants||[]).map((v,i)=>typeof v==="string"?{id:String(i),label:v,available:true}:{available:true,...v,id:v.id||String(i)})}
export function categorySlug(c?:string){return(c||"other").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function related(products:Product[],p:Product,count=8){const id=productId(p);const same=products.filter(x=>productId(x)!==id&&x.category===p.category&&x.imageUrl);const other=products.filter(x=>productId(x)!==id&&x.imageUrl&&!same.includes(x));return[...same,...other].slice(0,count)}
