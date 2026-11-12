export type Variant = { id?: string; label?: string; colour?: string; size?: string; style?: string; price?: number; image?: string; available?: boolean; sugargooProductUrl?: string; };
export type Product = {
  canonicalId?: string; doppelProductId?: string; title: string; displayTitle?: string; originalTitle?: string;
  price?: string; priceGBP?: number; category?: string; sellerName?: string | null; sellerId?: string | null;
  imageUrl?: string; images?: string[]; variants?: Array<string | Variant>; colours?: string[]; sizes?: string[];
  weight?: string; dimensions?: string; originalMarketplaceUrl?: string; sugargooProductUrl?: string;
};
export const productId = (p: Product) => p.doppelProductId || p.canonicalId?.replace(/^doppel:/, "");
export const productPrice = (p: Product) => p.price || (p.priceGBP != null ? \`£\${p.priceGBP.toFixed(2)}\` : "Price unavailable");
const marketingNoise = /\b(cross[- ]border|hot[- ]selling|wholesale|factory supply|amazon|aliexpress|temu|wish|same style|new style|in stock|double 11 discount|discount|202[0-9] autumn|autumn new)\b/gi;
export function cleanTitle(p: Product) {
  const curated = p.displayTitle?.trim();
  if (curated && curated.length >= 4) return curated;
  let title = (p.title || "").replace(marketingNoise, " ").replace(/[【\[].*?[】\]]/g, " ").replace(/\b(20\d{2})\b/g, " ").replace(/\s+/g, " ").replace(/^[\s,:;\-]+|[\s,:;\-]+$/g, "").trim();
  if (/^image \d+$/i.test(title) || title.length < 4) return p.category ? \`\${p.category} find\` : "Herocon find";
  const words = title.split(" ");
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const word of words) {
    const key = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(word);
  }
  return unique.slice(0, 10).join(" ") + (unique.length > 10 ? "…" : "");
}
export function imagesFor(p: Product) {
  const urls = [p.imageUrl, ...(p.images || [])].filter((x): x is string => Boolean(x) && /^https?:\/\//.test(x as string));
  const seen = new Set<string>(); return urls.filter(url => { const key = url.split("?")[0]; if (seen.has(key)) return false; seen.add(key); return true; });
}
export function normalizedVariants(p: Product): Variant[] {
  return (p.variants || []).map((v, i) => typeof v === "string" ? { id: String(i), label: v, available: true } : { available: true, ...v });
}
