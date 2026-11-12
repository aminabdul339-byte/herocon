import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Product } from "./catalogue";
export const getProducts = cache(async (): Promise<Product[]> => {
  const file = path.join(process.cwd(), "public", "herocon-products-import.json");
  const parsed = JSON.parse(await fs.readFile(file, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("Herocon catalogue is not an array");
  return parsed as Product[];
});
