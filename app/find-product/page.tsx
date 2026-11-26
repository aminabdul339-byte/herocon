import type {Metadata} from "next";
import Link from "next/link";
import {catalogueAccess} from "@/lib/catalogue-access";
import Header from "@/components/Header";
import ProductLinkForm from "@/components/ProductLinkForm";
import ProductLinkResults from "@/components/ProductLinkResults";
import "./find-product.css";
import HiobuyDiscovery from "@/components/HiobuyDiscovery";

import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Find products | Herocon",
 description:"Paste an original Taobao, 1688, Tmall or Weidian link to view seller product details on Herocon."
};
export default async function FindProductPage({searchParams}:{searchParams:Promise<{url?:string;hioId?:string;hioChannel?:string;method?:string}>}){
 const params=await searchParams;
 const initialUrl=typeof params.url==="string"?params.url.slice(0,1000):"";
 const access=await catalogueAccess();
 if(!access.customer)return <main className="hc-link-page hc-link-minimal"><Header/><section className="hc-plan-locked"><h1>Try a product link.</h1><p>Create a free account for saved link lookups and introductory marketplace searches.</p><Link href={"/account?next="+encodeURIComponent("/find-product"+(initialUrl?"?url="+encodeURIComponent(initialUrl):params.method==="image"?"?method=image":params.method==="keyword"?"?method=keyword":""))}>Sign in or join free</Link></section></main>;
 const owner=isOwnerPremiumCustomer(access.customer);
 const liveMethod=params.method==="image"?"image":params.method==="keyword"?"search":params.method==="live-link"?"parse":null;
 if(owner||liveMethod||params.hioId)return <main className="hc-link-page hc-link-minimal"><Header/><HiobuyDiscovery owner={owner} initialMode={liveMethod??(owner?"parse":"search")} initialUrl={owner||liveMethod==="parse"?initialUrl:""} initialId={typeof params.hioId==="string"?params.hioId.slice(0,500):""} initialChannel={typeof params.hioChannel==="string"?params.hioChannel:""}/></main>;
 return <main className="hc-link-page hc-link-minimal" data-has-url={Boolean(initialUrl)}><Header/>
  <section className="hc-link-intro" aria-labelledby="hc-link-title">
   <div className="hc-link-intro-inner">
    <div className="hc-link-intro-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 3.6l-1.7 1.7"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0l-3 3A4.5 4.5 0 0 0 11 20.4l1.7-1.7"/></svg></div>
    <p className="sc-kicker">FIND YOUR OWN PRODUCTS</p>
    <h1 id="hc-link-title">Find a product by link.</h1>
    <p className="hc-link-intro-copy">Find saved supplier photos, options and reference prices, or try live marketplace search with your account.</p>
    <div className="hc-link-input-panel">
     <nav className="hio-tabs hc-discovery-nav" aria-label="Discovery method"><Link aria-current="page" href="/find-product">Product link</Link><Link href="/find-product?method=keyword">Keyword search</Link><Link href="/find-product?method=image">Image search</Link></nav>
     <ProductLinkForm key={initialUrl} defaultValue={initialUrl}/>{!access.premium&&<p>Three successful saved link lookups per calendar month. Missing products do not use an allowance.</p>}
     <div className="hc-link-platforms"><span>Supported marketplaces</span><ul aria-label="Supported marketplaces"><li>1688</li><li>Taobao</li><li>Tmall</li><li>Weidian</li></ul></div>
    </div>
   </div>
  </section>
  <ProductLinkResults initialUrl={initialUrl}/>
 </main>;
}