import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";
import type { Product } from "./types";
const possible = ["herocon-products-import.json", "herocon-products-import.example.json"];
export const getProducts = cache(async (): Promise<Product[]> => {
  for (const name of possible) {
    try {
      const raw = await fs.readFile(path.join(process.cwd(), "public", name), "utf8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data as Product[];
    } catch {}
  }
  return [];
});
