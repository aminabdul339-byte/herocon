import Link from "next/link";
import Header from "@/components/Header";
import {currentCustomer} from "@/lib/customer-auth";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {checkoutLaunchReadiness} from "@/lib/live-checkout";
import {ownerAutoPilotConfigured} from "@/lib/owner-auto-price";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {findPersonalProduct} from "@/lib/personal-shop";
import BuckydropPilotPreflight from "@/components/BuckydropPilotPreflight";
import type {Metadata} from "next";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"BuckyDrop sample purchase preparation | Herocon",robots:{index:false,follow:false}};
type Search={productId?:string;sku?:string;quantity?:string};

export default async function BuckydropPilotPage({searchParams}:{searchParams:Promise<Search>}){
 const customer=await currentCustomer();
 const authorized=isOwnerPremiumCustomer(customer);
 if(!authorized)return <main style={{minHeight:"70vh",background:"#f9f8f3",color:"#23402e"}}>
  <Header/>
  <section style={{maxWidth:740,margin:"auto",padding:"76px 24px"}}>
   <p style={{fontSize:11,fontWeight:800,letterSpacing:2}}>HEROCON / PRIVATE OWNER PILOT</p>
   <h1 style={{font:"400 clamp(35px,5vw,58px)/1.1 Georgia,serif"}}>Prepare a sample purchase.</h1>
   <p style={{lineHeight:1.8}}>This BuckyDrop preflight is available only to the signed-in Herocon owner. It does not charge a card or place a supplier order.</p>
   <Link style={{color:"#21583a"}} href={"/account?next="+encodeURIComponent("/pilot/buckydrop")}>Sign in as owner</Link>
  </section>
 </main>;
 const params=await searchParams;
 const id=typeof params.productId==="string"&&/^[A-Za-z0-9_-]{5,100}$/.test(params.productId)
  ?params.productId:"75hQ5VG5QTLdpDC1MluyLg";
 const products=await getProducts();
 const product=products.find(p=>productId(p)===id||p.canonicalId===id);
 const personal=product?null:findPersonalProduct(id);
 const suggestedSku=typeof params.sku==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(params.sku)?params.sku:"";
 const requestedQuantity=typeof params.quantity==="string"&&/^[1-9][0-9]?$/.test(params.quantity)?Math.min(99,Number(params.quantity)):1;
 const readiness=checkoutLaunchReadiness("all_in");
 const automatic=ownerAutoPilotConfigured();
 return <main style={{minHeight:"100vh",background:"#f8f7f1",color:"#25432f"}}>
  <Header/>
  <section style={{maxWidth:1080,margin:"auto",padding:"55px 22px 90px"}}>
   <p style={{fontSize:11,letterSpacing:2,fontWeight:800,color:"#78907a"}}>HEROCON / BUCKYDROP PILOT</p>
   <h1 style={{font:"400 clamp(39px,6vw,67px)/1.08 Georgia,serif",letterSpacing:"-.04em",margin:"12px 0 16px"}}>Owner Premium. <em>Buy directly.</em></h1>
   <p style={{maxWidth:800,color:"#5c745e",lineHeight:1.8}}>Your verified owner account has complimentary Premium access. Select a saved BuckyDrop variant: Herocon calculates your product, delivery, 99p service fee, processing and profit reserve automatically. There is no manual quote form or repeat paid product-detail lookup. When activated, a verified Stripe payment triggers a single supplier order funded from the prepaid BuckyDrop wallet.</p>
   {!product&&!personal?<div style={{background:"#fff",border:"1px solid #d7e3d5",borderRadius:20,padding:28,marginTop:25}}>
     <h2>Product not found</h2><p>Please select a product from the Herocon catalogue with a verified marketplace link.</p>
     <Link href="/search">Browse products</Link>
    </div>:
    <BuckydropPilotPreflight productId={id} title={product?.title||personal?.name||"Product"} imageUrl={product?.imageUrl||personal?.imageUrl} recordedPrice={product?.priceGBP} sourceUrl={product?.originalMarketplaceUrl||personal?.originalUrl||""} initialSku={suggestedSku} initialQuantity={requestedQuantity}/>}
   <section style={{border:"1px solid #d8e4d7",borderRadius:22,background:"#fff",padding:"clamp(22px,3vw,34px)",marginTop:22}}>
    <h2 style={{font:"400 29px Georgia,serif",margin:"0 0 10px"}}>Owner-only automated checkout readiness</h2>
    <p style={{lineHeight:1.7,color:"#627966",fontSize:13}}>For this initial pilot, international shipping and merchant fees are included in the upfront GBP total. BuckyDrop automatic purchase and shipment require a funded account. The prepayment and one-payment flags must be verified before charging; an already paid order cannot be surprised with a second freight bill.</p>
    <p role="status" style={{fontWeight:800,color:readiness.enabled&&automatic.enabled?"#286947":"#a05634"}}>{readiness.enabled&&automatic.enabled?"All configured live-payment checks passed for the owner pilot.":"Live card charging and automatic BuckyDrop order submission are not enabled until all safeguards pass."}</p>
    {[...readiness.missing,...automatic.missing].length>0&&<ul style={{columns:"auto 270px",paddingLeft:19,fontSize:12,lineHeight:2,color:"#647665"}}>{[...new Set([...readiness.missing,...automatic.missing])].map(item=><li key={item}>{item}</li>)}</ul>}
    <p style={{fontSize:12,lineHeight:1.8,color:"#6b776b"}}>This stepper does not charge a card just by selecting a product. Automatic shipping budgets, BuckyDrop wallet auto-procurement, Stripe webhook settlement and order-status reconciliation must all be tested. Fresh stock and actual shipping may differ from saved snapshots.</p>
    <Link href="/search" style={{display:"inline-block",background:"#244a32",color:"#fff",textDecoration:"none",borderRadius:12,padding:"14px 20px",marginTop:12,fontSize:13,fontWeight:800}}>Choose another product</Link>
   </section>
  </section>
 </main>;
}
