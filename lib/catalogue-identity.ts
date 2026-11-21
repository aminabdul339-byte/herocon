import {normalizeMarketplaceLink} from "@/lib/marketplace-links";

export type MarketplaceIdentity={
  url:string;
  marketplace:"1688"|"Taobao"|"Tmall"|"Weidian";
  productId:string;
};

/** Canonical marketplace identity, never inferred from image CDNs or titles. */
export function marketplaceIdentity(value:unknown):MarketplaceIdentity|null {
 const url=normalizeMarketplaceLink(value);
 if(!url)return null;
 const parsed=new URL(url);
 if(parsed.hostname==="detail.1688.com"){
  const match=parsed.pathname.match(/^\/offer\/(\d{5,20})\.html$/);
  return match?{url,marketplace:"1688",productId:match[1]}:null;
 }
 if(parsed.hostname==="item.taobao.com"||parsed.hostname==="detail.tmall.com"){
  const id=parsed.searchParams.get("id");
  return id?{url,marketplace:parsed.hostname==="detail.tmall.com"?"Tmall":"Taobao",productId:id}:null;
 }
 if(parsed.hostname==="weidian.com"){
  const id=parsed.searchParams.get("itemID");
  return id?{url,marketplace:"Weidian",productId:id}:null;
 }
 return null;
}
