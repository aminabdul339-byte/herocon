import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";
import type { Product } from "./types";

type Raw = Record<string, unknown>;
const candidates = ["herocon-linked-products-only.json", "herocon-products-import.json", "herocon-products-import.example.json"];
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
    title: asString(raw.title) || asString(raw.originalTitle) || "Product",
    originalTitle: asString(raw.originalTitle),
    imageUrl: image,
    images: Array.isArray(raw.images) ? raw.images.filter((x): x is string => typeof x === "string" && /^https?:\/\//.test(x)) : undefined,
    price: asString(raw.price),
    category: asString(raw.category),
    sellerId: asString(raw.sellerId),
    sellerName: asString(raw.sellerName),
    originalMarketplaceUrl: source,
    sourceMarketplace: source ? new URL(source).hostname : undefined,
    collectedAt: asString(raw.collectedAt),
    variants: Array.isArray(raw.variants) ? raw.variants as Product["variants"] : undefined,
    agentLinks: raw.agentLinks && typeof raw.agentLinks === "object" && !Array.isArray(raw.agentLinks) ? raw.agentLinks as Record<string,string> : undefined,
  };
}
export const getProducts = cache(async (): Promise<Product[]> => {
  for (const name of candidates) {
    try {
      const raw = JSON.parse(await fs.readFile(path.join(process.cwd(), "public", name), "utf8"));
      const list: unknown = Array.isArray(raw) ? raw : raw?.products;
      if (!Array.isArray(list)) continue;
      const byId = new Map<string, Product>();
      for (const entry of list) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
        const product = normalise(entry as Raw);
        if (!product) continue;
        const id = product.doppelProductId!;
        const previous = byId.get(id);
        byId.set(id, previous ? {...previous, ...product, originalMarketplaceUrl: product.originalMarketplaceUrl || previous.originalMarketplaceUrl, imageUrl: product.imageUrl || previous.imageUrl} : product);
      }
      return [...byId.values()].filter(product => Boolean(product.originalMarketplaceUrl));
    } catch {}
  }
  return [];
});
