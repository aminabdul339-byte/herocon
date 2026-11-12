import type{Product,Variant}from"./types";
export const productId=(p:Product)=>p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||"";
export const productPrice=(p:Product)=>p.price||(p.priceGBP!=null?`£${p.priceGBP.toFixed(2)}`:"Price unavailable");
const noise=/\b(cross[- ]border|hot[- ]selling|wholesale|factory supply|amazon|aliexpress|temu|wish|same style|new style|in stock)\b/gi;
export function cleanTitle(p:Product){if(p.displayTitle?.trim())return p.displayTitle.trim();let t=(p.title||"").replace(noise," ").replace(/[【\[].*?[】\]]/g," ").replace(/\s+/g," ").replace(/^[\s,:;\-]+|[\s,:;\-]+$/g,"").trim();if(/^image \d+$/i.test(t)||t.length<4)return p.category?`${p.category} find`:"Herocon find";const w=t.split(" ");return w.slice(0,14).join(" ")+(w.length>14?"…":"")}
export function imagesFor(p:Product){const urls=[p.imageUrl,...(p.images||[])].filter((x):x is string=>Boolean(x)&&/^https?:\/\//.test(x as string));const seen=new Set<string>();return urls.filter(u=>{const k=u.split("?")[0];if(seen.has(k))return false;seen.add(k);return true})}
export function variantsFor(p:Product):Variant[]{return(p.variants||[]).map((v,i)=>typeof v==="string"?{id:String(i),label:v,available:true}:{available:true,...v,id:v.id||String(i)})}
export function categorySlug(c?:string){return(c||"other").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function related(products:Product[],p:Product,count=8){const id=productId(p);const same=products.filter(x=>productId(x)!==id&&x.category===p.category&&x.imageUrl);const other=products.filter(x=>productId(x)!==id&&x.imageUrl&&!same.includes(x));return[...same,...other].slice(0,count)}
