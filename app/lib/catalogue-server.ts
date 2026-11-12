import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Product } from "./catalogue";

async function readCatalogue(filename: string): Promise<Product[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", filename), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as Product[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export const getProducts = cache(async (): Promise<Product[]> => {
  // Keep server-side product and seller routes in sync with the two datasets used by Discover.
  const [primary, secondary] = await Promise.all([
    readCatalogue("herocon-products-import.json"),
    readCatalogue("herocon-catalogue-v0.3.json"),
  ]);
  const merged = new Map<string, Product>();
  for (const [index, product] of [...primary, ...secondary].entries()) {
    const id = product.doppelProductId || product.canonicalId?.replace(/^doppel:/, "");
    const key = id || product.canonicalId || `${product.title}-${product.sellerId || "unknown"}-${index}`;
    if (!merged.has(key)) merged.set(key, product);
  }
  return [...merged.values()];
});
