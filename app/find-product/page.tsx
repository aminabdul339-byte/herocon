import type {Metadata} from "next";
import Header from "@/components/Header";
import ProductLinkForm from "@/components/ProductLinkForm";
import ProductLinkResults from "@/components/ProductLinkResults";
export const metadata:Metadata={
 title:"Find a product by link",
 description:"Paste an original marketplace link to check existing saved product details without triggering paid supplier API requests."
};
export default async function FindProductPage({searchParams}:{searchParams:Promise<{url?:string}>}){
 const params=await searchParams;
 const initialUrl=typeof params.url==="string"?params.url.slice(0,1000):"";
 return <main className="hc-link-page"><Header/>
  <section className="sc-page-hero sc-container hc-link-hero">
   <p className="sc-kicker">FIND YOUR OWN PRODUCTS</p>
   <h1>Found something you love?<br/><em>Paste the link.</em></h1>
   <p>Already discovered a product on 1688, Taobao, Tmall or Weidian? Paste its original URL to check previously saved marketplace information. Where available, Herocon will show recorded seller details, product photos and reference prices without making a new paid sourcing API call.</p>
   <ProductLinkForm key={initialUrl} defaultValue={initialUrl}/>
  </section>
  <ProductLinkResults initialUrl={initialUrl}/>
 </main>;
}