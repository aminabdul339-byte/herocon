import type {Metadata} from "next";
import Link from "next/link";
import {linkTrial} from "@/lib/free-link-trial";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {catalogueAccess} from "@/lib/catalogue-access";
import {PremiumNotice} from "@/components/MembershipPlans";
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
 if(!access.customer)return <main className="hc-link-page hc-link-minimal"><Header/><section className="hc-plan-locked"><h1>Try a product link.</h1><p>Create a free account to try one marketplace product link. Premium unlocks more.</p><Link href={"/account?next="+encodeURIComponent("/find-product"+(initialUrl?"?url="+encodeURIComponent(initialUrl):""))}>Sign in or join free</Link></section></main>;
 const trial=access.premium?null:await linkTrial(access.customer.id).catch(()=>undefined);
 if(!access.premium&&trial===undefined)return <main><Header/><section className="hc-plan-locked"><h1>Link lookup temporarily unavailable.</h1><p>Please try again later.</p></section></main>;
 if(trial&&normalizeMarketplaceLink(initialUrl)!==trial.url)return <main className="hc-link-page hc-link-minimal"><Header/><section className="hc-plan-locked"><h1>Your free link lookup has been used.</h1><p>Upgrade to Premium to look up more products.</p><Link href={"/find-product?url="+encodeURIComponent(trial.url)}>Reopen your first product</Link><PremiumNotice feature="more marketplace link lookups"/></section></main>;
 const owner=isOwnerPremiumCustomer(access.customer);
 const liveMethod=params.method==="image"?"image":params.method==="keyword"?"search":null;
 if(owner||(access.premium&&(liveMethod||params.hioId)))return <main className="hc-link-page hc-link-minimal"><Header/><HiobuyDiscovery owner={owner} initialMode={liveMethod??(owner?"parse":"search")} initialUrl={owner?initialUrl:""} initialId={typeof params.hioId==="string"?params.hioId.slice(0,500):""} initialChannel={typeof params.hioChannel==="string"?params.hioChannel:""}/></main>;
 return <main className="hc-link-page hc-link-minimal" data-has-url={Boolean(initialUrl)}><Header/>
  <section className="hc-link-intro" aria-labelledby="hc-link-title">
   <div className="hc-link-intro-inner">
    <div className="hc-link-intro-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 3.6l-1.7 1.7"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0l-3 3A4.5 4.5 0 0 0 11 20.4l1.7-1.7"/></svg></div>
    <p className="sc-kicker">FIND YOUR OWN PRODUCTS</p>
    <h1 id="hc-link-title">Find a product by link.</h1>
    <p className="hc-link-intro-copy">Find saved supplier photos, options and reference prices, or search the 1688 marketplace with Premium.</p>
    <div className="hc-link-input-panel">
     <nav className="hio-tabs hc-discovery-nav" aria-label="Discovery method"><Link aria-current="page" href="/find-product">Product link</Link><Link href={access.premium?"/find-product?method=keyword":"/membership"}>Keyword search{!access.premium&&<small>Premium</small>}</Link><Link href={access.premium?"/find-product?method=image":"/membership"}>Image search{!access.premium&&<small>Premium</small>}</Link></nav>
     {trial?<p>Your free lookup has been used. You can revisit this product; <Link href="/membership">join Premium</Link> to try another link.</p>:<><ProductLinkForm key={initialUrl} defaultValue={initialUrl}/>{!access.premium&&<p>One free product link per account. A valid submitted link uses your trial, even if no saved listing is found.</p>}</>}
     <div className="hc-link-platforms"><span>Supported marketplaces</span><ul aria-label="Supported marketplaces"><li>1688</li><li>Taobao</li><li>Tmall</li><li>Weidian</li></ul></div>
    </div>
   </div>
  </section>
  <ProductLinkResults initialUrl={initialUrl}/>
 </main>;
}