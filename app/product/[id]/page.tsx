import Link from "next/link";
import { notFound } from "next/navigation";
import VariantPurchase from "../../components/VariantPurchase";
import ProductCard from "../../components/ProductCard";
import { cleanTitle, getProducts, imagesFor, productId, productPrice } from "../../lib/catalogue";
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const products = await getProducts(); const p = products.find(x => productId(x) === id || x.canonicalId === id || x.canonicalId === `doppel:${id}`); if (!p) notFound();
  const product = { ...p, originalTitle: p.originalTitle || p.title };
  const more = products.filter(x => product.sellerId && x.sellerId === product.sellerId && productId(x) !== id).slice(0, 8);
  const excluded = new Set([id, ...more.map(x => productId(x))]);
  let similar = products.filter(x => x.category === product.category && !excluded.has(productId(x) || "") && x.imageUrl).slice(0, 8);
  if (similar.length < 8) similar = [...similar, ...products.filter(x => !excluded.has(productId(x) || "") && !similar.includes(x) && x.imageUrl).slice(0, 8 - similar.length)];
  return <main><nav className="premium-nav"><Link className="brand" href="/">HERO<span>CON</span></Link><div><Link href="/">Discover</Link>{product.sellerId && <Link href={`/seller/${encodeURIComponent(product.sellerId)}`}>Seller</Link>}</div></nav><div className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>{product.category || "Discovery"}</span></div><section className="product-shell"><VariantPurchase product={product} title={cleanTitle(product)} images={imagesFor(product)} price={productPrice(product)} id={id}/>{product.sellerId && <Link className="seller-strip" href={`/seller/${encodeURIComponent(product.sellerId)}`}><span><small>SELLER</small><b>{product.sellerName || "View seller catalogue"}</b></span><span>Explore all products →</span></Link>}<details className="details-drawer"><summary>Product details <span>+</span></summary><div><p>{product.originalTitle}</p><dl>{product.weight && <><dt>Weight</dt><dd>{product.weight}</dd></>}{product.dimensions && <><dt>Package</dt><dd>{product.dimensions}</dd></>}<dt>Herocon product ID</dt><dd>{id}</dd></dl></div></details></section>{more.length > 0 && <section className="editorial-section"><header><p className="eyebrow">THE SELLER EDIT</p><h2>More from {product.sellerName}</h2></header><div className="lux-grid">{more.map(x => <ProductCard key={x.canonicalId || productId(x)} p={x}/>)}</div></section>}<section className="editorial-section toned"><header><p className="eyebrow">CHOSEN FOR YOU</p><h2>You may also like</h2></header><div className="lux-grid">{similar.map(x => <ProductCard key={x.canonicalId || productId(x)} p={x}/>)}</div></section></main>;
}
