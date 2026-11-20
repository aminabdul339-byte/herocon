import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";
import type { Product } from "./types";
import {classifyProduct} from "./product-taxonomy";
import {getDiscoveredProducts} from "./discovered-products";
import {normalizeMarketplaceLink} from "./marketplace-links";
import {withoutEmoji} from "./emoji-free";

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
  const image = asString(raw.imageUrl);
  return {
    canonicalId: "doppel:" + id,
    doppelProductId: id,
    title: withoutEmoji(asString(raw.title) || asString(raw.originalTitle) || "Product") || "Product",
    originalTitle: raw.originalTitle ? withoutEmoji(asString(raw.originalTitle) || "") : undefined,
    imageUrl: image,
    images: Array.isArray(raw.images) ? raw.images.filter((x): x is string => typeof x === "string" && /^https?:\/\//.test(x)) : undefined,
    price: asString(raw.price) || (typeof raw.priceGBP === "number" ? `£${raw.priceGBP.toFixed(2)}` : undefined),
    priceGBP: typeof raw.priceGBP === "number" ? raw.priceGBP : undefined,
    category: asString(raw.category),
    sellerId: asString(raw.sellerId),
    sellerName: raw.sellerName ? withoutEmoji(asString(raw.sellerName) || "") : undefined,
    originalMarketplaceUrl: source,
    sourceMarketplace: source ? new URL(source).hostname : undefined,
    collectedAt: asString(raw.collectedAt),
    sourceBatch: asString(raw.sourceBatch),
    variants: Array.isArray(raw.variants) ? raw.variants as Product["variants"] : undefined,
    agentLinks: raw.agentLinks && typeof raw.agentLinks === "object" && !Array.isArray(raw.agentLinks) ? raw.agentLinks as Record<string,string> : undefined,
  };
}
export const getBaseProducts = cache(async (): Promise<Product[]> => {
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
          originalMarketplaceUrl: product.originalMarketplaceUrl || previous.originalMarketplaceUrl,
          imageUrl: product.imageUrl || previous.imageUrl,
          images: product.images || previous.images,
          variants: product.variants || previous.variants,
          agentLinks: product.agentLinks || previous.agentLinks,
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
  return [...byId.values()].filter(product => Boolean(product.originalMarketplaceUrl)).map(product => ({...product,category:classifyProduct(product.title,product.category)}));
});

// The original catalogue remains in committed JSON files. Products found through
// the public link search are durably stored in the private Vercel Blob store and
// appear in product search, category browsing, saved items, and product pages.
export const getProducts = cache(async ():Promise<Product[]>=>{
 const staticProducts=await getBaseProducts();
 const discovered=(await getDiscoveredProducts()).map(p=>({...p,title:withoutEmoji(p.title),displayTitle:p.displayTitle?withoutEmoji(p.displayTitle):undefined,sellerName:p.sellerName?withoutEmoji(p.sellerName):p.sellerName}));
 if(!discovered.length)return staticProducts;
 const links=new Set(staticProducts.map(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl)||p.originalMarketplaceUrl).filter(Boolean));
 const ids=new Set(staticProducts.map(p=>p.doppelProductId));
 const additions=discovered.filter(p=>{
  const key=normalizeMarketplaceLink(p.originalMarketplaceUrl);
  if(!key||links.has(key)||ids.has(p.doppelProductId))return false;
  links.add(key);
  ids.add(p.doppelProductId);
  return true;
 });
 return [...additions,...staticProducts];
});