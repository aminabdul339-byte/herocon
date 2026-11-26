import Link from "next/link";
import type {ReactNode} from "react";
import {ArrowIcon} from "@/components/ArrowIcon";

type GlyphName="catalogue"|"discover"|"keyword"|"image"|"link";
function Glyph({name}:{name:GlyphName}){
 return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {name==="catalogue"?<><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></>:name==="discover"?<><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="11" cy="11" r="4"/><path d="m14 14 3 3"/></>:name==="keyword"?<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>:name==="image"?<><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 6"/></>:<><path d="M10 13a4.5 4.5 0 0 0 6.4 0l3-3A4.5 4.5 0 0 0 13 3.6l-1.7 1.7"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0l-3 3A4.5 4.5 0 0 0 11 20.4l1.7-1.7"/></>}
 </svg>;
}
const methods=[
 {name:"keyword",title:"Keyword search",subtitle:"Describe an item",href:"/find-product?method=keyword"},
 {name:"image",title:"Image search",subtitle:"Upload a photo",href:"/find-product?method=image"},
 {name:"link",title:"Product link",subtitle:"Paste a URL",href:"/find-product"}
] as const;

export default function SourcingHub({children,expanded}:{children:ReactNode;expanded:boolean}){
 if(!expanded)return <div className="hc-sourcing-compact">{children}<Link href="/find-product?method=keyword" prefetch={false} className="hc-sourcing-compact-link"><Glyph name="discover"/> Can't find it? Try the Product Finder <ArrowIcon direction="right"/></Link></div>;
 return <div className="hc-sourcing-hub" aria-label="Choose how to source products">
  <section className="hc-sourcing-mode hc-sourcing-catalogue" aria-labelledby="hc-source-catalogue">
   <div className="hc-sourcing-mode-label">THE CATALOGUE</div>
   <h2 id="hc-source-catalogue">Explore the catalogue.</h2>
   <p className="hc-sourcing-description">Browse our curated collection of sourced products.</p>
   <div className="hc-sourcing-search">{children}</div>
   <p className="hc-sourcing-foot">No account needed.</p>
  </section>
  <section className="hc-sourcing-mode hc-sourcing-finder" aria-labelledby="hc-source-finder">
   <div className="hc-sourcing-mode-label">PRODUCT FINDER</div>
   <h2 id="hc-source-finder">Find your own products.</h2>
   <p className="hc-sourcing-description">Search beyond the catalogue, directly from Chinese marketplaces.</p>
   <div className="hc-sourcing-methods">{methods.map(method=><Link key={method.name} className="hc-sourcing-method" href={method.href} prefetch={false}><span className="hc-sourcing-method-icon"><Glyph name={method.name}/></span><span className="hc-sourcing-method-copy"><strong>{method.title}</strong><small>{method.subtitle}</small></span></Link>)}</div>
   <p className="hc-sourcing-foot">Try with a free account. Availability varies by marketplace.</p>
  </section>
 </div>;
}
