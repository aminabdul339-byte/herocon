import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";
import type { Product } from "./types";
import {classifyProduct,isModestFashion} from "./product-taxonomy";
import {CATEGORY_OVERRIDES} from "./category-overrides";
import {categoryAuditOverrides} from "./category-audit-store";
import {getDiscoveredProducts} from "./discovered-products";
import {normalizeMarketplaceLink} from "./marketplace-links";
import {marketplaceIdentity} from "./catalogue-identity";
import {excludedCatalogueListing} from "./catalogue-editorial-exclusions";
import {withoutEmoji} from "./emoji-free";
import {unavailableSourceHashes,isUnavailableSource} from "./catalogue-unavailable";

type Raw = Record<string, unknown>;
const candidates = ["herocon-current-catalogue.json", "herocon-linked-products-only.json", "herocon-products-import.json", "herocon-products-import.example.json"];
const additions = ["herocon-verified-marketplace-links.json", "herocon-wigs-20261118.json", "herocon-nails-20261118.json", "herocon-makeup-brushes-20261119.json"];
const hosts = new Set(["detail.1688.com", "item.taobao.com", "detail.tmall.com", "weidian.com", "www.weidian.com"]);
function validSource(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try { const url = new URL(value); if (url.protocol === "https:" && hosts.has(url.hostname)) return value; } catch {}
}
function asString(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function normalise(raw: Raw): Product | null {
  const id = asString(raw.doppelProductId) || asString(raw.canonicalId)?.replace(/^doppel:/, "");
  if (!id) return null;
  const source = validSource(raw.originalMarketplaceUrl) || validSource(raw.marketplaceUrl) || validSource(raw.directLink) || (Array.isArray(raw.originalMarketplaceUrls) ? raw.originalMarketplaceUrls.map(validSource).find(Boolean) : undefined);
  const identity=marketplaceIdentity(source);
  const image = asString(raw.imageUrl);
  const gallery=Array.isArray(raw.images)?raw.images.filter((x):x is string=>typeof x==="string"&&/^https:\/\/[^\s]+$/i.test(x)).slice(0,36):[];
  const priceGBP=typeof raw.priceGBP==="number"&&Number.isFinite(raw.priceGBP)&&raw.priceGBP>=0?raw.priceGBP:undefined;
  const variants=Array.isArray(raw.variants)?raw.variants.filter(v=>typeof v==="string"||
    (v!==null&&typeof v==="object"&&!Array.isArray(v)&&typeof (v as {id?:unknown}).id==="string")).slice(0,150) as Product["variants"]:undefined;
  return {
    canonicalId: "doppel:" + id,
    doppelProductId: id,
    title: withoutEmoji(asString(raw.title) || asString(raw.originalTitle) || "Product") || "Product",
    originalTitle: raw.originalTitle ? withoutEmoji(asString(raw.originalTitle) || "") : undefined,
    imageUrl: image,
    images:gallery,
    price:priceGBP!=null?`£${priceGBP.toFixed(2)}`:asString(raw.price),
    priceGBP,
    category: asString(raw.category),
    sellerId: asString(raw.sellerId),
    sellerName: raw.sellerName ? withoutEmoji(asString(raw.sellerName) || "") : undefined,
    originalMarketplaceUrl: source,
    sourceMarketplace:identity?.marketplace,
    sourceProductId:identity?.productId,
    variantCount:typeof raw.variantCount==="number"&&Number.isInteger(raw.variantCount)&&raw.variantCount>=0?raw.variantCount:variants?.length,
    priceCNY:typeof raw.priceCNY==="number"&&Number.isFinite(raw.priceCNY)&&raw.priceCNY>=0?raw.priceCNY:undefined,
    descriptionText:asString(raw.descriptionText)?.slice(0,10000),
    detailImages:Array.isArray(raw.detailImages)?raw.detailImages.filter((x):x is string=>typeof x==="string"&&/^https:\/\/[^\s]+$/i.test(x)).slice(0,30):[],
    sourceSpecs:Array.isArray(raw.sourceSpecs)?raw.sourceSpecs.filter((x):x is {name:string;value:string}=>!!x&&typeof x==="object"&&typeof x.name==="string"&&typeof x.value==="string").slice(0,50):[],
    collectedAt:asString(raw.collectedAt),
    sourceBatch: asString(raw.sourceBatch),
    variants,
    agentLinks: raw.agentLinks && typeof raw.agentLinks === "object" && !Array.isArray(raw.agentLinks) ? raw.agentLinks as Record<string,string> : undefined,
  };
}
// Committed catalogue files are immutable for the life of a deployment.
let basePromise:Promise<Product[]>|undefined;
async function loadBaseProducts():Promise<Product[]> {
  const byId = new Map<string, Product>();
  async function addFile(name: string): Promise<boolean> {
    try {
      const raw = JSON.parse(await fs.readFile(path.join(process.cwd(), "public", name), "utf8"));
      const list: unknown = Array.isArray(raw) ? raw : raw?.products;
      if (!Array.isArray(list)) return false;
      for (const entry of list) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
        const product = normalise(entry as Raw);
        if (!product) continue;
        const id = product.doppelProductId!;
        const previous = byId.get(id);
        byId.set(id, previous ? {
          ...previous, ...product,
          title: product.title&&product.title!=="Product"?product.title:previous.title,
          originalTitle:product.originalTitle||previous.originalTitle,
          price:product.price||previous.price,
          priceGBP:product.priceGBP??previous.priceGBP,
          category:product.category||previous.category,
          collectedAt:product.collectedAt||previous.collectedAt,
          sourceMarketplace:product.sourceMarketplace||previous.sourceMarketplace,
          sourceProductId:product.sourceProductId||previous.sourceProductId,
          originalMarketplaceUrl:product.originalMarketplaceUrl||previous.originalMarketplaceUrl,
          imageUrl:product.imageUrl||previous.imageUrl,
          images:product.images?.length
            ?[...new Set([...(previous.images||[]),...(product.images||[])])].slice(0,36)
            :previous.images,
          variants:product.variants?.length?product.variants:previous.variants,
          variantCount:product.variantCount??previous.variantCount,
          descriptionText:product.descriptionText||previous.descriptionText,
          detailImages:product.detailImages?.length?product.detailImages:previous.detailImages,
          sourceSpecs:product.sourceSpecs?.length?product.sourceSpecs:previous.sourceSpecs,
          agentLinks:product.agentLinks || previous.agentLinks,
          sellerName: product.sellerName || previous.sellerName,
          sellerId: product.sellerId || previous.sellerId,
          sourceBatch: product.sourceBatch || previous.sourceBatch,
        } : product);
      }
      return true;
    } catch { return false; }
  }
  // Load one canonical catalogue, then merge additional verified products by ID.
  for (const name of candidates) {
    if (await addFile(name)) break;
  }
  for (const name of additions) await addFile(name);
  return [...byId.values()].filter(product => Boolean(product.originalMarketplaceUrl)&&!excludedCatalogueListing(product.originalMarketplaceUrl,product.title,product.originalTitle)).map(product => ({...product,category:isModestFashion([product.title,product.originalTitle].filter(Boolean).join(" "),product.sellerName)?"Modest Fashion":CATEGORY_OVERRIDES[product.doppelProductId||""]||classifyProduct(product.title,product.category)}));
}
export const getBaseProducts=cache(()=>basePromise??=(loadBaseProducts().catch(error=>{basePromise=undefined;throw error;})));

// The original catalogue remains in committed JSON files. Products found through
// the public link search are durably stored in the private Vercel Blob store and
// appear in product search, category browsing, saved items, and product pages.
export const getProducts = cache(async ():Promise<Product[]>=>{
 const [base,hidden,audit,discoveredRows]=await Promise.all([getBaseProducts(),unavailableSourceHashes(),categoryAuditOverrides(),getDiscoveredProducts()]);
 const corrected=(p:Product):Product=>({...p,category:isModestFashion([p.title,p.originalTitle,p.displayTitle].filter(Boolean).join(" "),p.sellerName)?"Modest Fashion":CATEGORY_OVERRIDES[p.doppelProductId||""]||audit[p.doppelProductId||""]||classifyProduct(p.title,p.category)});
 const staticProducts=base.filter(p=>!isUnavailableSource(p.originalMarketplaceUrl,hidden)).map(corrected);
 const discovered=discoveredRows.filter(p=>!isUnavailableSource(p.originalMarketplaceUrl,hidden)&&!excludedCatalogueListing(p.originalMarketplaceUrl,p.title,p.originalTitle,p.displayTitle)).map(p=>({...p,title:withoutEmoji(p.title),displayTitle:p.displayTitle?withoutEmoji(p.displayTitle):undefined,sellerName:p.sellerName?withoutEmoji(p.sellerName):p.sellerName}));
 if(!discovered.length)return staticProducts;
 const links=new Set(staticProducts.map(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl)||p.originalMarketplaceUrl).filter(Boolean));
 const ids=new Set(staticProducts.map(p=>p.doppelProductId));
 // Join by canonical original marketplace link, never by CDN image or title.
 // Keep existing product IDs, titles and GBP prices; fill only missing detail.
 const staticByUrl=new Map(staticProducts.map((p,i)=>[normalizeMarketplaceLink(p.originalMarketplaceUrl),i]));
 const enriched=[...staticProducts];
 const additions:Product[]=[];
 for(const p of discovered){
  const key=normalizeMarketplaceLink(p.originalMarketplaceUrl);
  if(!key)continue;
  const index=staticByUrl.get(key);
  if(index!==undefined){
    const previous=enriched[index];
    const gallery=[...new Set([previous.imageUrl,...(previous.images||[]),p.imageUrl,...(p.images||[])]
      .filter((u):u is string=>typeof u==="string"&&/^https:\/\//.test(u)))].slice(0,24);
    enriched[index]={
      ...previous,imageUrl:previous.imageUrl||p.imageUrl,images:gallery,
      sellerName:previous.sellerName||p.sellerName,
      variantCount:previous.variantCount??p.variantCount,
      variants:previous.variants?.length?previous.variants:p.variants,
      priceCNY:previous.priceCNY??p.priceCNY,
      descriptionText:previous.descriptionText||p.descriptionText,
      detailImages:previous.detailImages?.length?previous.detailImages:p.detailImages,
      sourceSpecs:previous.sourceSpecs?.length?previous.sourceSpecs:p.sourceSpecs
    };
    continue;
  }
  if(links.has(key)||ids.has(p.doppelProductId))continue;
  links.add(key);ids.add(p.doppelProductId);
  additions.push(p);
 }
 return [...additions,...enriched].map(corrected);
});