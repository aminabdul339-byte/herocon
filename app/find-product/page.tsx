import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {catalogueAccess} from "@/lib/catalogue-access";
import Header from "@/components/Header";
import ProductLinkForm from "@/components/ProductLinkForm";
import ProductLinkResults from "@/components/ProductLinkResults";
import "./find-product.css";
import HiobuyDiscovery from "@/components/HiobuyDiscovery";
import ProductFinderPanel from "@/components/ProductFinderPanel";

import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Find products | Herocon",
 description:"Discover products by keyword, image or marketplace link. Explore original Chinese supplier listings on Herocon."
};
export default async function FindProductPage({searchParams}:{searchParams:Promise<{url?:string;hioId?:string;hioChannel?:string;method?:string}>}){
 const params=await searchParams;
 const initialUrl=typeof params.url==="string"?params.url.slice(0,1000):"";
 const access=await catalogueAccess();
 const owner=isOwnerPremiumCustomer(access.customer);
 const liveMethod=params.method==="image"?"image":params.method==="keyword"?"search":params.method==="live-link"?"parse":null;
 const target=new URLSearchParams();if(initialUrl)target.set("url",initialUrl);if(params.method)target.set("method",params.method);if(params.hioId)target.set("hioId",params.hioId);if(params.hioChannel)target.set("hioChannel",params.hioChannel);
 const login="/account?next="+encodeURIComponent("/find-product"+(target.size?"?"+target.toString():""));
 if(initialUrl&&!liveMethod&&!owner){const link=normalizeMarketplaceLink(initialUrl);if(link){const found=(await getProducts()).find(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl)===link);if(found)redirect("/product/"+encodeURIComponent(productId(found)));}}
 if(access.customer&&(owner||liveMethod||params.hioId))return <main className="hc-link-page hc-link-minimal"><Header/><HiobuyDiscovery key={JSON.stringify([liveMethod,initialUrl,params.hioId,params.hioChannel])} owner={owner} initialMode={liveMethod??(owner?"parse":"search")} unified initialUrl={owner||liveMethod==="parse"?initialUrl:""} initialId={typeof params.hioId==="string"?params.hioId.slice(0,500):""} initialChannel={typeof params.hioChannel==="string"?params.hioChannel:""}/></main>;
 return <main className="hc-link-page hc-link-minimal" data-has-url={Boolean(initialUrl)}><Header/>
  <ProductFinderPanel method={liveMethod==="search"?"search":liveMethod==="image"?"image":"link"}>
   {!liveMethod&&<ProductLinkForm key={initialUrl} defaultValue={initialUrl}/>}
   {!access.customer?<div className="hc-link-guest"><p>{liveMethod==="search"?"Join free to search for products by keyword.":liveMethod==="image"?"Join free to find products by photo.":liveMethod==="parse"?"Sign in to look up a live 1688 or Weidian product link.":initialUrl?"If your product is not already in the public catalogue, sign in to look up its supplier details.":"Browse saved products without signing in. Join free to try live product discovery."}</p><Link className="hc-link-guest-cta" href={login}>Sign in or join free</Link></div>:<>
    <p className="hio-note">Can’t find your product? <Link className="hc-finder-switch" href={"/find-product?method=live-link"+(initialUrl?"&url="+encodeURIComponent(initialUrl):"")}>Try a live search</Link>.</p>
    {!access.premium&&<p className="hio-note">Free membership includes a one-time discovery allowance.</p>}
   </>}
   <div className="hc-link-platforms"><span>{liveMethod==="search"||liveMethod==="image"?"Live search":liveMethod==="parse"?"Live product links":"Saved product links"}</span><ul aria-label="Supported marketplaces">{(liveMethod==="search"||liveMethod==="image"?["1688"]:liveMethod==="parse"?["1688","Weidian"]:["1688","Taobao","Tmall","Weidian"]).map(m=><li key={m}>{m}</li>)}</ul></div>
  </ProductFinderPanel>
  {access.customer&&<ProductLinkResults initialUrl={initialUrl}/>}
 </main>;
}