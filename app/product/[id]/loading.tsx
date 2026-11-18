import Header from "@/components/Header";

export default function LoadingProduct(){
 return <main><Header/>
  <div className="crumbs"><span>Home</span><span>/</span><span>Product details</span></div>
  <section className="product-layout hc-product-loading" aria-busy="true" aria-label="Loading product">
   <div><div className="gallery-main hc-skeleton-gallery"><span className="hc-skeleton-spinner" aria-hidden="true"/><p>Loading product photographs…</p></div></div>
   <aside className="buy-panel hc-skeleton-side">
    <div className="hc-skeleton-block hc-skeleton-small"/>
    <div className="hc-skeleton-block hc-skeleton-title"/>
    <div className="hc-skeleton-block hc-skeleton-title-short"/>
    <div className="hc-skeleton-block hc-skeleton-price"/>
    <p role="status">Loading seller details…</p>
    <div className="hc-skeleton-block hc-skeleton-variant"/>
    <div className="hc-skeleton-block hc-skeleton-variant"/>
   </aside>
  </section>
 </main>;
}