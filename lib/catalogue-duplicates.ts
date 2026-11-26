import {normalizeMarketplaceLink} from "./marketplace-links";
import type {Product} from "./types";
import {BUSINESS_PAGE_ONE_ORDER} from "./business-catalogue-edit";
import {featuredPreviewIds} from "./catalogue-access-model";

type CardRow={id:string;title:string;category?:string;url?:string;image?:string;priceGBP?:number|null};
export type DuplicateGroup={reason:"same-source"|"same-photo-and-title"|"verified-photo-match";rows:CardRow[];keep:CardRow};
const verifiedRingIds=new Set(["DgoQWJ3vpr7IwjtVXqAyKA","OpohXCbwOZlcaz5oQkeBCQ","yXvk725eTqDy7uIaBMAuUQ"]);
const pinned=new Set<string>([...BUSINESS_PAGE_ONE_ORDER,...featuredPreviewIds]);
const nameKey=(s:string)=>s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
export function photoIdentity(raw?:string):string{
 if(!raw)return "";
 if(raw.startsWith("/shop-for-yourself-images/"))return raw.split("?")[0];
 try{
  const u=new URL(raw);if(u.protocol!=="https:")return "";
  // Only remove known image transform parameters. Drive query IDs identify
  // different photographs even when the endpoint pathname is identical.
  if(u.hostname==="drive.google.com"){const id=u.searchParams.get("id");return id?"drive:"+id:u.href;}
  if(/(?:^|\.)alicdn\.com$/.test(u.hostname)){
   const filename=u.pathname.split("/").pop()||"";
   if(/^(?:O1CN|TB)|!!\d/i.test(filename))return "ali:"+filename.replace(/(\.(?:jpg|jpeg|png|webp))(?:_.*|\.webp)$/i,"$1");
  }
  if(/(?:^|\.)geilicdn\.com$/.test(u.hostname))return u.origin+u.pathname;
  return u.href;
 }catch{return "";}
}
const meaningful=(s:string)=>s.length>=12&&!/^(?:product|unknown|untitled|marketplace product|ring|bag|dress|shoes?)$/.test(s);
const positive=(p?:number|null)=>typeof p==="number"&&Number.isFinite(p)&&p>0?p:Infinity;
export function auditDuplicateCards(rows:CardRow[]){
 const parent=rows.map((_,i)=>i),seen=new Map<string,number>(),reasons=new Map<number,Set<DuplicateGroup["reason"]>>();
 function root(i:number):number{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;}
 function connect(i:number,k:string,reason:DuplicateGroup["reason"]){
  if(!k)return;const previous=seen.get(k);if(previous===undefined){seen.set(k,i);return;}
  const a=root(previous),b=root(i);if(a!==b){parent[b]=a;const combined=new Set([...(reasons.get(a)||[]),...(reasons.get(b)||[]),reason]);reasons.set(a,combined);}else{const r=reasons.get(a)||new Set();r.add(reason);reasons.set(a,r);}
 }
 const photos=new Map<string,CardRow[]>(),titles=new Map<string,CardRow[]>();
 rows.forEach((r,i)=>{
  const source=normalizeMarketplaceLink(r.url),photo=photoIdentity(r.image),name=nameKey(r.title),category=r.category||"";
  if(source)connect(i,"source:"+source,"same-source");
  if(photo&&meaningful(name))connect(i,"photo-title:"+photo+"|"+name+"|"+category,"same-photo-and-title");
  if(verifiedRingIds.has(r.id))connect(i,"verified:ring-20261126","verified-photo-match");
  if(photo)photos.set(photo,[...(photos.get(photo)||[]),r]);
  if(meaningful(name))titles.set(name+"|"+category,[...(titles.get(name+"|"+category)||[]),r]);
 });
 const groups=new Map<number,CardRow[]>();rows.forEach((r,i)=>{const k=root(i);groups.set(k,[...(groups.get(k)||[]),r]);});
 const duplicateGroups:DuplicateGroup[]=[],suppressed=new Set<string>();
 for(const [k,g] of groups){
  if(g.length<2)continue;
  const why=reasons.get(k)||new Set(),reason=why.has("verified-photo-match")?"verified-photo-match":why.has("same-source")?"same-source":"same-photo-and-title";
  // Keep deliberate homepage selections. Otherwise use the lowest positive
  // GBP reference price, and never copy one supplier's price to another.
  const keep=[...g].sort((a,b)=>Number(pinned.has(b.id))-Number(pinned.has(a.id))||positive(a.priceGBP)-positive(b.priceGBP))[0];
  for(const r of g)if(r.id!==keep.id)suppressed.add(r.id);
  duplicateGroups.push({reason,rows:g,keep});
 }
 const photoReview=[...photos.values()].filter(g=>g.length>1&&new Set(g.filter(r=>!suppressed.has(r.id)).map(r=>r.id)).size>1);
 const titleReview=[...titles.values()].filter(g=>g.length>1&&new Set(g.filter(r=>!suppressed.has(r.id)).map(r=>photoIdentity(r.image))).size>1);
 return {total:rows.length,suppressed,duplicateGroups,photoReview,titleReview};
}
export const businessCardRow=(p:Product):CardRow=>({id:p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||"",title:p.originalTitle||p.title,category:p.category,url:p.originalMarketplaceUrl,image:p.imageUrl,priceGBP:p.priceGBP});
export function dedupeBusinessCards(products:Product[]):Product[]{
 const {suppressed}=auditDuplicateCards(products.map(businessCardRow));return products.filter(p=>!suppressed.has(businessCardRow(p).id));
}
type PersonalRow={id:string;name:string;category:string;originalUrl:string;imageUrl:string;priceGBP:number|null};
export const personalCardRow=(p:PersonalRow):CardRow=>({id:p.id,title:p.name,category:p.category,url:p.originalUrl,image:p.imageUrl,priceGBP:p.priceGBP});
export function dedupePersonalCards<T extends PersonalRow>(products:readonly T[]):T[]{
 const {suppressed}=auditDuplicateCards(products.map(personalCardRow));return products.filter(p=>!suppressed.has(p.id));
}
