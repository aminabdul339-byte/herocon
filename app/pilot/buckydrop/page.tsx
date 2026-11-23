import Link from "next/link";
import Header from "@/components/Header";
import {currentCustomer} from "@/lib/customer-auth";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {checkoutLaunchReadiness} from "@/lib/live-checkout";
import BuckydropPilotPreflight from "@/components/BuckydropPilotPreflight";
import type {Metadata} from "next";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"BuckyDrop sample purchase preparation | Herocon",robots:{index:false,follow:false}};
type Search={productId?:string};

export default async function BuckydropPilotPage({searchParams}:{searchParams:Promise<Search>}){
 const customer=await currentCustomer();
 const ownerId=process.env.HEROCON_TRIAL_OWNER_USER_ID?.trim()
  ||process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID?.trim();
 const authorized=Boolean(customer&&ownerId&&customer.id===ownerId);
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
 const readiness=checkoutLaunchReadiness("all_in");
 return <main style={{minHeight:"100vh",background:"#f8f7f1",color:"#25432f"}}>
  <Header/>
  <section style={{maxWidth:1080,margin:"auto",padding:"55px 22px 90px"}}>
   <p style={{fontSize:11,letterSpacing:2,fontWeight:800,color:"#78907a"}}>HEROCON / BUCKYDROP PILOT</p>
   <h1 style={{font:"400 clamp(39px,6vw,67px)/1.08 Georgia,serif",letterSpacing:"-.04em",margin:"12px 0 16px"}}>Your first <em>sample order.</em></h1>
   <p style={{maxWidth:800,color:"#5c745e",lineHeight:1.8}}>Use the existing live BuckyDrop product connection to verify a single source item and its exact SKU. This page is read-only: it never pays Stripe, submits an order, holds a parcel, or releases delivery.</p>
   {!product?<div style={{background:"#fff",border:"1px solid #d7e3d5",borderRadius:20,padding:28,marginTop:25}}>
     <h2>Product not found</h2><p>Please select a product from the Herocon catalogue with a verified marketplace link.</p>
     <Link href="/search">Browse products</Link>
    </div>:
    <BuckydropPilotPreflight productId={id} title={product.title} imageUrl={product.imageUrl} recordedPrice={product.priceGBP} sourceUrl={product.originalMarketplaceUrl||""}/>}
   <section style={{border:"1px solid #d8e4d7",borderRadius:22,background:"#fff",padding:"clamp(22px,3vw,34px)",marginTop:22}}>
    <h2 style={{font:"400 29px Georgia,serif",margin:"0 0 10px"}}>Live payment readiness</h2>
    <p style={{lineHeight:1.7,color:"#627966",fontSize:13}}>The draft all-inclusive pilot requires all of these independent merchant attestations before Stripe can charge a card. Your preferred estimated-shipping plus customer-approved top-up model still requires a separate shipping-adjustment checkout and provider dispatch-hold workflow.</p>
    <p role="status" style={{fontWeight:800,color:readiness.enabled?"#266c40":"#a05634"}}>{readiness.enabled?"All-inclusive pilot payment checks passed.":"Customer purchase still disabled. "+readiness.missing.length+" launch requirement(s) outstanding."}</p>
    {readiness.missing.length>0&&<ul style={{columns:"auto 270px",paddingLeft:19,fontSize:12,lineHeight:2,color:"#647665"}}>{readiness.missing.map(item=><li key={item}>{item}</li>)}</ul>}
    <p style={{fontSize:12,lineHeight:1.8,color:"#6b776b"}}>Do not enable the Stripe or BuckyDrop order-write switches until shipping currency, the funded merchant account, carrier fees, order auto-purchase and parcel hold/release settings have been confirmed and end-to-end tested.</p>
    <Link href="/admin/checkout" style={{display:"inline-block",background:"#244a32",color:"#fff",textDecoration:"none",borderRadius:12,padding:"14px 20px",marginTop:12,fontSize:13,fontWeight:800}}>Open private merchant quote form</Link>
   </section>
  </section>
 </main>;
}
