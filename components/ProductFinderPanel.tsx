import Link from "next/link";
import type {ReactNode} from "react";

export type FinderMethod="link"|"search"|"image";
const methods=[
 {key:"link",name:"Product link",href:"/find-product"},
 {key:"search",name:"Keyword search",href:"/find-product?method=keyword"},
 {key:"image",name:"Image search",href:"/find-product?method=image"}
] as const;

export default function ProductFinderPanel({method,children}:{method:FinderMethod;children:ReactNode}){
 return <section className="hc-link-intro hc-finder-intro" aria-labelledby="hc-link-title">
  <div className="hc-link-intro-inner">
   <p className="sc-kicker">THE HEROCON PRODUCT FINDER</p>
   <h1 id="hc-link-title">Find your own products.</h1>
   <p className="hc-link-intro-copy">Discover products from Chinese marketplaces by link, keyword or image.</p>
   <div className="hc-link-input-panel hc-finder-panel">
    <nav className="hio-tabs hc-discovery-nav" aria-label="Discovery method">
     {methods.map(m=><Link key={m.key} href={m.href} prefetch={false} aria-current={method===m.key?"page":undefined}>{m.name}</Link>)}
    </nav>
    {children}
   </div>
  </div>
 </section>;
}
