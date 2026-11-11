"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

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

const categories = ["All", "Shoes", "Clothing", "Tops", "Bottoms", "Outerwear", "Bags", "Accessories", "Jewelry", "Uncategorised"];

function productRouteId(product: Product): string | undefined {
  if (product.doppelProductId) return product.doppelProductId;
  if (product.canonicalId) return product.canonicalId.replace(/^doppel:/, "");
  return undefined;
}

function normalizeProduct<T extends Product>(product: T): T {
  const category = product.category?.split("/")[0]?.trim();
  return {
    ...product,
    category: category || "Uncategorised",
    title: !product.title || product.title === "Image 1"
      ? (category ? `${category} product` : product.sellerName ? `Product from ${product.sellerName}` : "Untitled product")
      : product.title,
  };
}

function mergeProducts(primary: Product[], additional: Product[]): Product[] {
  const merged = new Map<string, Product>();
  for (const product of [...primary, ...additional]) {
    const id = productRouteId(product);
    const key = id || product.canonicalId || `${product.title}-${product.sellerName || ""}-${merged.size}`;
    if (!merged.has(key)) merged.set(key, normalizeProduct(product));
  }
  return [...merged.values()];
}

export default function Home() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [items, setItems] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  const filtered = useMemo(
    () =>
      items.filter(
        (p) =>
          (cat === "All" || p.category === cat) &&
          (!q || [p.title, p.category, p.sellerName].join(" ").toLowerCase().includes(q.toLowerCase())),
      ),
    [items, q, cat],
  );

  async function load() {
    try {
      setLoadError("");
      const [primaryResponse, v03Response] = await Promise.all([
        fetch("/herocon-products-import.json"),
        fetch("/herocon-catalogue-v0.3.json"),
      ]);
      if (!primaryResponse.ok || !v03Response.ok) {
        throw new Error(`Catalogue request failed (original: ${primaryResponse.status}, v0.3: ${v03Response.status})`);
      }
      const [primary, v03]: [unknown, unknown] = await Promise.all([
        primaryResponse.json(),
        v03Response.json(),
      ]);
      if (!Array.isArray(primary) || !Array.isArray(v03)) throw new Error("A catalogue JSON file is not an array");
      setItems(mergeProducts(primary as Product[], v03 as Product[]));
      setLoaded(true);
    } catch (error) {
      setLoaded(false);
      setLoadError(error instanceof Error ? error.message : "Unknown catalogue loading error");
    }
  }

  return (
    <main>
      <nav>
        <Link className="brand" href="/">HERO<span>CON</span></Link>
        <div className="navright"><a href="#discover">Discover</a><a href="#about">About</a></div>
      </nav>
      <section className="hero">
        <p className="eyebrow">THE SOURCING DISCOVERY PLATFORM</p>
        <h1>Source something<br /><i>remarkable.</i></h1>
        <p className="intro">Discover products and sellers from China through one beautifully simple sourcing experience.</p>
        <div className="search">
          <span>⌕</span>
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search products, styles or sellers…" onFocus={() => { if (!loaded) void load(); }} />
          <button onClick={() => void load()}>Explore</button>
        </div>
        <p className="hint">Find it. Source it. Sell it.</p>
      </section>
      <section id="discover" className="catalogue">
        <div className="sectionhead">
          <div><p className="eyebrow">CURATED DISCOVERY</p><h2>Explore the catalogue</h2></div>
          <span className="count">{loaded ? `${filtered.length.toLocaleString()} RESULTS` : "CATALOGUE NOT CONNECTED"}</span>
        </div>
        <div className="filters">
          {categories.map((category) => (
            <button key={category} className={cat === category ? "active" : ""} onClick={() => { setCat(category); if (!loaded) void load(); }}>{category}</button>
          ))}
        </div>
        {!loaded ? (
          <div className="empty">
            <div className="emptyicon">✳</div><h3>Your next find starts here.</h3>
            <p>Loading the product catalogue from <code>both catalogue files</code>.</p>
            <button onClick={() => void load()}>Try loading catalogue</button>
            {loadError && <p role="alert">{loadError}. Check that the catalogue file is available in this deployment.</p>}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty"><h3>No matching products</h3><p>Try another search or category.</p></div>
        ) : (
          <div className="grid">
            {filtered.slice(0, 120).map((product, index) => {
              const id = productRouteId(product);
              const card = (
                <>
                  <div className="photo">{product.imageUrl ? <img src={product.imageUrl} alt={product.title} loading="lazy" /> : <span>No image</span>}</div>
                  <div className="productmeta"><span>{product.category || "DISCOVER"}</span><b>{product.price || (product.priceGBP != null ? `£${product.priceGBP.toFixed(2)}` : "")}</b></div>
                  <h3>{product.title}</h3><p>{product.sellerName || "Seller details unavailable"}</p>
                </>
              );
              return id ? (
                <Link className="product" key={product.canonicalId || index} href={`/product/${encodeURIComponent(id)}`}>{card}</Link>
              ) : (
                <article className="product" key={product.canonicalId || index}>{card}</article>
              );
            })}
          </div>
        )}
      </section>
      <footer id="about">
        <Link className="brand" href="/">HEROCON</Link><span>Find it. Source it. Sell it.</span>
        <small>Product information is supplied by third-party sources and may change.</small>
      </footer>
    </main>
  );
}
