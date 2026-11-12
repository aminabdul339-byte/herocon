import type{Product,Variant}from"./types";
export const productId=(p:Product)=>p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||"";
export const productPrice=(p:Product)=>p.price||(p.priceGBP!=null?`£${p.priceGBP.toFixed(2)}`:"Price unavailable");
const noise=/\b(cross[- ]border|hot[- ]selling|wholesale|factory supply|amazon|aliexpress|temu|wish|same style|new style|in stock|big brand|high quality|202[0-9] (?:new|autumn|winter|spring|summer))\b/gi;
export function cleanTitle(p:Product){
  const raw=(p.displayTitle||p.title||"").trim();
  let t=raw.replace(/[【\[][^[\]【】]*[】\]]/g," ").replace(noise," ").replace(/(?:!|\?|\.){2,}/g," ").replace(/\s+/g," ").replace(/^[\s,:;!\-]+|[\s,:;!\-]+$/g,"").trim();
  t=t.replace(/^(?:[A-Z0-9_-]{4,}\s*[!:-]\s*)+/i,"").trim();
  const words=t.split(/\s+/).filter(Boolean);
  if(/^image\s*\d+$/i.test(t)||words.length===0||t.length<4)return p.category?`${p.category} product`:"Product";
  const short=words.slice(0,12).join(" ");
  return short.length>90?short.slice(0,87).replace(/\s+\S*$/,"")+"…":short+(words.length>12?"…":"");
}
export function imagesFor(p:Product){const urls=[p.imageUrl,...(p.images||[])].filter((x):x is string=>Boolean(x)&&/^https?:\/\//.test(x as string));const seen=new Set<string>();return urls.filter(u=>{const k=u.split("?")[0];if(seen.has(k))return false;seen.add(k);return true})}
export function variantsFor(p:Product):Variant[]{return(p.variants||[]).map((v,i)=>typeof v==="string"?{id:String(i),label:v,available:true}:{available:true,...v,id:v.id||String(i)})}
export function categorySlug(c?:string){return(c||"other").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function related(products:Product[],p:Product,count=8){const id=productId(p);const same=products.filter(x=>productId(x)!==id&&x.category===p.category&&x.imageUrl);const other=products.filter(x=>productId(x)!==id&&x.imageUrl&&!same.includes(x));return[...same,...other].slice(0,count)}
