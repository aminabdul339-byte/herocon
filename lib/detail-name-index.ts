import "server-only";
import source from "@/data/catalogue-detail-names.json";
import {normalizeMarketplaceLink} from "./marketplace-links";
import type {Product} from "./types";
type NameRow={url:string;image:string;title:string;status:string};
const index=source as unknown as {business:Record<string,NameRow>;personal:Record<string,NameRow>;summary:Record<string,unknown>};
export function savedAuditedTitle(collection:"business"|"personal",id:string,url:unknown,image?:string):string|undefined{
 const r=index[collection][id];return r&&r.status!=="failed"&&r.title&&r.url===normalizeMarketplaceLink(url)&&r.image===(image||"")?r.title:undefined;
}
export function withAuditedBusinessName(p:Product):Product{
 const auditedTitle=savedAuditedTitle("business",p.doppelProductId||"",p.originalMarketplaceUrl,p.imageUrl);
 return auditedTitle?{...p,auditedTitle}:p;
}
export const nameAuditSummary=index.summary;
