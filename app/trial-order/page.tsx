import Link from "next/link";
import type {Metadata} from "next";
import Header from "@/components/Header";
import FulfillbotTrialOrder from "@/components/FulfillbotTrialOrder";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {currentCustomer} from "@/lib/customer-auth";

export const dynamic="force-dynamic";
export const metadata:Metadata={
  title:"Trial sourcing | Herocon",
  description:"Review a one-product sourcing request through Herocon. Owner pilot only."
};
type Props={searchParams:Promise<{productId?:string;specs?:string}>};
export default async function TrialOrderPage({searchParams}:Props){
  const search=await searchParams;
  const id=typeof search.productId==="string"?search.productId:"";
  const allowed=/^[A-Za-z0-9_-]{5,100}$/.test(id);
  const ownerId=process.env.HEROCON_TRIAL_OWNER_USER_ID?.trim()
    ||process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID?.trim();
  const customer=await currentCustomer();
  const owner=Boolean(customer&&ownerId&&customer.id===ownerId);
  const products=allowed?await getProducts():[];
  const product=products.find(item=>productId(item)===id||item.canonicalId===id);
  if(!product)return <main style={{minHeight:"100vh",background:"#f9f8f3"}}><Header/>
    <section style={{maxWidth:800,margin:"0 auto",padding:"80px 22px"}}>
      <h1>Product unavailable</h1>
      <p>Choose an item with an original marketplace link from Herocon first.</p>
      <Link href="/search">Explore products</Link>
    </section>
  </main>;
  const recorded=typeof product.price==="string"&&product.price.startsWith("£")?product.price:
    typeof product.priceGBP==="number"?"£"+product.priceGBP.toFixed(2):undefined;
  const specs=typeof search.specs==="string"&&search.specs.length<=300?
    search.specs:(id==="JkGxy3I8MBvabwyDsSO7uQ"?"Black-Alo":"");
  return <main style={{minHeight:"100vh",background:"#f9f8f3"}}>
    <Header/>
    <FulfillbotTrialOrder
      productId={id}
      title={product.displayTitle||product.title}
      image={product.imageUrl}
      recordedPrice={recorded}
      sourceUrl={normalizeMarketplaceLink(product.originalMarketplaceUrl)||undefined}
      initialSpecs={specs}
      owner={owner}/>
  </main>;
}
