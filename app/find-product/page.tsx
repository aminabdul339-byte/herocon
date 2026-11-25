import type {Metadata} from "next";
import {catalogueAccess} from "@/lib/catalogue-access";
import {PremiumNotice} from "@/components/MembershipPlans";
import Header from "@/components/Header";
import ProductLinkForm from "@/components/ProductLinkForm";
import ProductLinkResults from "@/components/ProductLinkResults";
import "./find-product.css";
import HiobuyDiscovery from "@/components/HiobuyDiscovery";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Find a product by link",
 description:"Paste an original Taobao, 1688, Tmall or Weidian link to view seller product details on Herocon."
};
export default async function FindProductPage({searchParams}:{searchParams:Promise<{url?:string;hioId?:string;hioChannel?:string}>}){
 const params=await searchParams;
 const initialUrl=typeof params.url==="string"?params.url.slice(0,1000):"";
 const access=await catalogueAccess();
 if(!access.premium)return <main className="hc-link-page hc-link-minimal"><Header/><section className="hc-plan-locked"><h1>Find your own products.</h1><p>Search by marketplace link with Premium. Live keyword and image search are in rollout.</p><PremiumNotice feature="marketplace sourcing"/></section></main>;
 if(isOwnerPremiumCustomer(access.customer))return <main className="hc-link-page hc-link-minimal"><Header/><HiobuyDiscovery initialUrl={initialUrl} initialId={typeof params.hioId==="string"?params.hioId.slice(0,500):""} initialChannel={typeof params.hioChannel==="string"?params.hioChannel:""}/></main>;
 return <main className="hc-link-page hc-link-minimal" data-has-url={Boolean(initialUrl)}><Header/>
  <section className="hc-link-intro" aria-labelledby="hc-link-title">
   <div className="hc-link-intro-inner">
    <div className="hc-link-intro-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 3.6l-1.7 1.7"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0l-3 3A4.5 4.5 0 0 0 11 20.4l1.7-1.7"/></svg></div>
    <p className="sc-kicker">FIND YOUR OWN PRODUCTS</p>
    <h1 id="hc-link-title">Find a product by link.</h1>
    <p className="hc-link-intro-copy">Find saved supplier photos, options and reference prices. Live keyword, image and marketplace searches are in rollout.</p>
    <div className="hc-link-input-panel">
     <ProductLinkForm key={initialUrl} defaultValue={initialUrl}/>
     <div className="hc-link-platforms"><span>Supported marketplaces</span><ul aria-label="Supported marketplaces"><li>1688</li><li>Taobao</li><li>Tmall</li><li>Weidian</li></ul></div>
    </div>
   </div>
  </section>
  <ProductLinkResults initialUrl={initialUrl}/>
 </main>;
}