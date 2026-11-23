import Link from "next/link";
import Header from "@/components/Header";
import {currentCustomer} from "@/lib/customer-auth";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {checkoutLaunchReadiness} from "@/lib/live-checkout";
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
 const readiness=checkoutLaunchReadiness("products");
 return <main style={{minHeight:"100vh",background:"#f8f7f1",color:"#25432f"}}>
  <Header/>
  <section style={{maxWidth:1080,margin:"auto",padding:"55px 22px 90px"}}>
   <p style={{fontSize:11,letterSpacing:2,fontWeight:800,color:"#78907a"}}>HEROCON / BUCKYDROP PILOT</p>
   <h1 style={{font:"400 clamp(39px,6vw,67px)/1.08 Georgia,serif",letterSpacing:"-.04em",margin:"12px 0 16px"}}>Owner Premium. <em>Buy directly.</em></h1>
   <p style={{maxWidth:800,color:"#5c745e",lineHeight:1.8}}>Your verified Herocon owner account has complimentary premium access and does not need a £9.99 subscription. Select the product and variant to prepare direct checkout without a manual quote. Live payment and BuckyDrop order creation remain blocked until carrier pricing, the second freight payment and supplier dispatch workflow are verified.</p>
   {!product&&!personal?<div style={{background:"#fff",border:"1px solid #d7e3d5",borderRadius:20,padding:28,marginTop:25}}>
     <h2>Product not found</h2><p>Please select a product from the Herocon catalogue with a verified marketplace link.</p>
     <Link href="/search">Browse products</Link>
    </div>:
    <BuckydropPilotPreflight productId={id} title={product?.title||personal?.name||"Product"} imageUrl={product?.imageUrl||personal?.imageUrl} recordedPrice={product?.priceGBP} sourceUrl={product?.originalMarketplaceUrl||personal?.originalUrl||""} initialSku={suggestedSku} initialQuantity={requestedQuantity}/>}
   <section style={{border:"1px solid #d8e4d7",borderRadius:22,background:"#fff",padding:"clamp(22px,3vw,34px)",marginTop:22}}>
    <h2 style={{font:"400 29px Georgia,serif",margin:"0 0 10px"}}>Direct payment readiness</h2>
    <p style={{lineHeight:1.7,color:"#627966",fontSize:13}}>The owner-only product payment has no membership requirement. The remaining tasks are final GBP product and estimated shipping pricing, a customer-approved warehouse freight adjustment, verified signed Stripe payments and a safe BuckyDrop parcel hold/release workflow. The older all-inclusive checkout must not be used for adjustable-shipping orders.</p>
    <p role="status" style={{fontWeight:800,color:"#a05634"}}>Real checkout not enabled. Supplier lookup and variant selection are available, but no money is charged.</p>
    {readiness.missing.length>0&&<ul style={{columns:"auto 270px",paddingLeft:19,fontSize:12,lineHeight:2,color:"#647665"}}>{readiness.missing.map(item=><li key={item}>{item}</li>)}</ul>}
    <p style={{fontSize:12,lineHeight:1.8,color:"#6b776b"}}>Do not enable the Stripe or BuckyDrop order-write switches until shipping currency, the funded merchant account, carrier fees, order auto-purchase and parcel hold/release settings have been confirmed and end-to-end tested.</p>
    <Link href="/search" style={{display:"inline-block",background:"#244a32",color:"#fff",textDecoration:"none",borderRadius:12,padding:"14px 20px",marginTop:12,fontSize:13,fontWeight:800}}>Choose another product</Link>
   </section>
  </section>
 </main>;
}
