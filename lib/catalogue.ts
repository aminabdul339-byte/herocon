import type{Product,Variant}from"./types";
export const productId=(p:Product)=>p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||"";
export const productPrice=(p:Product)=>p.price||(p.priceGBP!=null?`£${p.priceGBP.toFixed(2)}`:"View marketplace price");
export {conciseProductTitle as cleanTitle} from "./product-title";
export function imagesFor(p:Product){const urls=[p.imageUrl,...(p.images||[])].filter((x):x is string=>Boolean(x)&&/^https?:\/\//.test(x as string));const seen=new Set<string>();return urls.filter(u=>{const k=u.split("?")[0];if(seen.has(k))return false;seen.add(k);return true})}
export function variantsFor(p:Product):Variant[]{return(p.variants||[]).map((v,i)=>typeof v==="string"?{id:String(i),label:v,available:true}:{available:true,...v,id:v.id||String(i)})}
export function categorySlug(c?:string){return(c||"other").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function related(products:Product[],p:Product,count=8){
 const id=productId(p);
 const words=(s:string)=>new Set(s.toLowerCase().match(/[a-z]{3,}/g)?.filter(w=>!["the","and","for","with","new","style","fashion","women","mens","men","product","original","high","quality"].includes(w))||[]);
 const target=words(p.title||"");
 const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0};
 const candidates=products.filter(x=>productId(x)!==id&&Boolean(x.imageUrl));
 return candidates.map(x=>{
  const overlap=[...words(x.title||"")].filter(w=>target.has(w)).length;
  const sameCategory=Boolean(p.category&&x.category&&p.category===x.category);
  const score=(sameCategory?100:0)+Math.min(overlap,8)*12;
  return {product:x,score,tie:hash(id+"|"+productId(x))};
 }).sort((a,b)=>b.score-a.score||a.tie-b.tie).slice(0,count).map(x=>x.product);
}
