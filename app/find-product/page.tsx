import type {Metadata} from "next";
import Header from "@/components/Header";
import ProductLinkForm from "@/components/ProductLinkForm";
import ProductLinkResults from "@/components/ProductLinkResults";
import "./find-product.css";
export const metadata:Metadata={
 title:"Find a product by link",
 description:"Paste an original Taobao, 1688, Tmall or Weidian link to view seller product details on Herocon."
};
export default async function FindProductPage({searchParams}:{searchParams:Promise<{url?:string}>}){
 const params=await searchParams;
 const initialUrl=typeof params.url==="string"?params.url.slice(0,1000):"";
 return <main className="hc-link-page hc-link-minimal" data-has-url={Boolean(initialUrl)}><Header/>
  <section className="hc-link-intro" aria-labelledby="hc-link-title">
   <div className="hc-link-intro-inner">
    <div className="hc-link-intro-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 3.6l-1.7 1.7"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0l-3 3A4.5 4.5 0 0 0 11 20.4l1.7-1.7"/></svg></div>
    <p className="sc-kicker">FIND YOUR OWN PRODUCTS</p>
    <h1 id="hc-link-title">Found something you love?<br/><em>Paste the link.</em></h1>
    <p className="hc-link-intro-copy">Discover the seller&apos;s photos, available options and reference prices in CNY and GBP, all in one place.</p>
    <div className="hc-link-input-panel">
     <ProductLinkForm key={initialUrl} defaultValue={initialUrl}/>
     <div className="hc-link-platforms"><span>Supported marketplaces</span><ul aria-label="Supported marketplaces"><li>1688</li><li>Taobao</li><li>Tmall</li><li>Weidian</li></ul></div>
    </div>
   </div>
  </section>
  <ProductLinkResults initialUrl={initialUrl}/>
 </main>;
}