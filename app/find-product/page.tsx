import type {Metadata} from "next";
import Header from "@/components/Header";
import ProductLinkForm from "@/components/ProductLinkForm";
import ProductLinkResults from "@/components/ProductLinkResults";
export const metadata:Metadata={
 title:"Find a product by link",
 description:"Paste an original Taobao, 1688, Tmall or Weidian link to view seller product details on Herocon."
};
export default async function FindProductPage({searchParams}:{searchParams:Promise<{url?:string}>}){
 const params=await searchParams;
 const initialUrl=typeof params.url==="string"?params.url.slice(0,1000):"";
 return <main className="hc-link-page"><Header/>
  <section className="sc-page-hero sc-container hc-link-hero">
   <p className="sc-kicker">FIND YOUR OWN PRODUCTS</p>
   <h1>Found something you love?<br/><em>Paste the link.</em></h1>
   <p>Already discovered a product on 1688, Taobao, Tmall or Weidian? Paste its original URL and view the seller's product photos, options, CNY prices and approximate GBP equivalents on Herocon.</p>
   <ProductLinkForm key={initialUrl} defaultValue={initialUrl}/>
  </section>
  <ProductLinkResults initialUrl={initialUrl}/>
 </main>;
}