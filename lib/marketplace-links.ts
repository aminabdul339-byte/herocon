import type {BuckydropProduct} from "@/lib/buckydrop";

/** Turn known Chinese marketplace share links into a stable, link-only product identifier.
 * The server never fetches these URLs. Only BuckyDrop receives the canonical URL.
 */
export function normalizeMarketplaceLink(input:unknown):string|null {
 if(typeof input!=="string"||input.length>1000)return null;
 const value=input.trim();
 if(value.length>700||!value.startsWith("https://"))return null;
 let url:URL;
 try{url=new URL(value);}catch{return null;}
 if(url.protocol!=="https:"||url.username||url.password||url.port)return null;
 if(url.hash)url.hash="";
 const hostname=url.hostname.toLowerCase();
 if(hostname==="detail.1688.com"||hostname==="m.1688.com"){
  const match=url.pathname.match(/^\/offer\/(\d{5,20})\.html$/);
  return match?"https://detail.1688.com/offer/"+match[1]+".html":null;
 }
 if(hostname==="item.taobao.com"||hostname==="detail.tmall.com"||hostname==="h5.m.taobao.com"){
  if(hostname==="h5.m.taobao.com" && url.pathname!=="/awp/core/detail.htm")return null;
  if(hostname!=="h5.m.taobao.com"&&url.pathname!=="/item.htm")return null;
  const id=url.searchParams.get("id");
  if(!id||!/^\d{5,20}$/.test(id))return null;
  return "https://"+(hostname==="detail.tmall.com"?"detail.tmall.com":"item.taobao.com")+"/item.htm?id="+id;
 }
 if(hostname==="weidian.com"||hostname==="www.weidian.com"){
  if(url.pathname!=="/item.html")return null;
  const id=url.searchParams.get("itemID")||url.searchParams.get("itemId");
  if(!id||!/^\d{5,20}$/.test(id))return null;
  return "https://weidian.com/item.html?itemID="+id;
 }
 return null;
}

export type ProductLinkLookupResult={product:BuckydropProduct;productLink:string};