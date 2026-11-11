import Link from "next/link";
import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";

type Product = {
  canonicalId?: string;
  doppelProductId?: string;
  title: string;
  price?: string;
  priceGBP?: number;
  category?: string;
  sellerName?: string | null;
  sellerId?: string | null;
  imageUrl?: string;
  source?: string;
};

function productRouteId(product: Product): string | undefined {
  if (product.doppelProductId) return product.doppelProductId;
  if (product.canonicalId) return product.canonicalId.replace(/^doppel:/, "");
  return undefined;
}

async function getProducts(): Promise<Product[]> {
  const directory = path.join(process.cwd(), "public");
  const [primaryContents, v03Contents] = await Promise.all([
    fs.readFile(path.join(directory, "herocon-products-import.json"), "utf8"),
    fs.readFile(path.join(directory, "herocon-catalogue-v0.3.json"), "utf8"),
  ]);
  const primary: unknown = JSON.parse(primaryContents);
  const v03: unknown = JSON.parse(v03Contents);
  if (!Array.isArray(primary) || !Array.isArray(v03)) throw new Error("A Herocon product catalogue is not a valid array.");
  const merged = new Map<string, Product>();
  for (const raw of [...primary, ...v03] as Product[]) {
    const id = productRouteId(raw);
    const key = id || raw.canonicalId || `${raw.title}-${raw.sellerName || ""}-${merged.size}`;
    if (merged.has(key)) continue;
    const category = raw.category?.split("/")[0]?.trim();
    merged.set(key, {
      ...raw,
      category: category || "Uncategorised",
      title: !raw.title || raw.title === "Image 1"
        ? (category ? `${category} product` : raw.sellerName ? `Product from ${raw.sellerName}` : "Untitled product")
        : raw.title,
    });
  }
  return [...merged.values()];
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find((item) => productRouteId(item) === id || item.canonicalId === id);
  if (!product) notFound();

  const moreFromSeller = products
    .filter((item) => {
      if (item === product) return false;
      if (product.sellerId) return item.sellerId === product.sellerId;
      return Boolean(product.sellerName && item.sellerName === product.sellerName);
    })
    .slice(0, 8);

  const price = product.price || (product.priceGBP != null ? `£${product.priceGBP.toFixed(2)}` : "Price unavailable");

  return (
    <main>
      <nav>
        <Link className="brand" href="/">HERO<span>CON</span></Link>
        <div className="navright"><Link href="/">Discover</Link></div>
      </nav>
      <section className="productdetail">
        <div className="detailimage">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.title} /> : <span>No image available</span>}
        </div>
        <div className="detailcopy">
          <p className="eyebrow">{product.category || "HEROCON FIND"}</p>
          <h1>{product.title}</h1>
          <p className="detailseller">{product.sellerName || "Seller details unavailable"}</p>
          <p className="detailprice">{price}</p>
          <Link className="buybutton" href={`/go/sugargoo/${encodeURIComponent(id)}`}>Buy with Sugargoo</Link>
          <p className="source-note">Continue discovering on Herocon. You will only leave Herocon when you choose to buy with Sugargoo.</p>
        </div>
      </section>
      {moreFromSeller.length > 0 && (
        <section className="catalogue">
          <div className="sectionhead"><div><p className="eyebrow">MORE FROM THIS SELLER</p><h2>{product.sellerName || "This seller"}</h2></div></div>
          <div className="grid">
            {moreFromSeller.map((item, index) => {
              const relatedId = productRouteId(item);
              const content = (
                <>
                  <div className="photo">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} loading="lazy" /> : <span>No image</span>}</div>
                  <div className="productmeta"><span>{item.category || "DISCOVER"}</span><b>{item.price || (item.priceGBP != null ? `£${item.priceGBP.toFixed(2)}` : "")}</b></div>
                  <h3>{item.title}</h3>
                </>
              );
              return relatedId ? (
                <Link className="product" key={item.canonicalId || index} href={`/product/${encodeURIComponent(relatedId)}`}>{content}</Link>
              ) : (
                <article className="product" key={item.canonicalId || index}>{content}</article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
