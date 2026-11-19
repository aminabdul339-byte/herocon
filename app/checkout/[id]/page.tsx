import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ApprovedCheckoutButton from "@/components/ApprovedCheckoutButton";
import {getApprovedQuote} from "@/lib/approved-checkout";
import {checkoutLaunchReadiness} from "@/lib/live-checkout";
import type {Metadata} from "next";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Review your private checkout quote",robots:{index:false,follow:false}};
const money=(pence:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(pence/100);
export default async function CheckoutQuote({params}:{params:Promise<{id:string}>}){
 const {id}=await params,quote=await getApprovedQuote(id);
 if(!quote)notFound();
 const expired=Date.parse(quote.expiresAt)<=Date.now()+30*60*1000;
 const live=checkoutLaunchReadiness().enabled;
 return <main style={{background:"#fafbf7",minHeight:"70vh"}}>
  <Header/>
  <section style={{maxWidth:790,margin:"auto",padding:"65px 24px 100px",color:"#25442f"}}>
   <p style={{fontSize:11,letterSpacing:".15em",fontWeight:800}}>HEROCON / PRIVATE CUSTOMER CHECKOUT</p>
   <h1 style={{font:"400 clamp(42px,6vw,66px)/1.06 Georgia,serif",letterSpacing:"-.05em"}}>Your approved <em>order quote.</em></h1>
   <p>This order has been priced and reviewed by the merchant. The final amount is in British pounds, including the shipping and tax charges shown below. Your payment will be processed by Stripe once checkout is enabled.</p>
   <div style={{background:"white",border:"1px solid #dce6d9",padding:25,borderRadius:9,marginTop:28}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center"}}>
     <strong>Order summary</strong><span style={{fontSize:11,color:"#66816b"}}>United Kingdom delivery only</span>
    </div>
    {quote.lines.map((line,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",gap:16,borderBottom:"1px solid #edf0ea",padding:"18px 0"}}>
     <div><strong>{line.title}</strong><div style={{fontSize:12,color:"#7d8b7e"}}>{line.variant} · Qty {line.quantity}</div></div>
     <strong style={{whiteSpace:"nowrap"}}>{money(Math.round(line.unitPriceGBP*100)*line.quantity)}</strong>
    </div>)}
    <div style={{marginTop:20,fontSize:14}}>
     <p style={{display:"flex",justifyContent:"space-between"}}><span>Products</span><strong>{money(quote.productSubtotalPence)}</strong></p>
     <p style={{display:"flex",justifyContent:"space-between"}}><span>Shipping</span><strong>{money(quote.shippingPence)}</strong></p>
     <p style={{display:"flex",justifyContent:"space-between"}}><span>Applicable taxes/duties</span><strong>{money(quote.taxPence)}</strong></p>
     <p style={{display:"flex",justifyContent:"space-between",paddingTop:18,borderTop:"1px solid #bdcfbd",fontSize:21}}><strong>Grand total</strong><strong>{money(quote.totalPence)}</strong></p>
    </div>
    <p style={{fontSize:12,color:"#708472"}}>This quote expires on {new Date(quote.expiresAt).toLocaleString("en-GB",{timeZone:"Europe/London"})} (UK time). An expired quote must be approved again.</p>
    {expired?<p role="status" style={{padding:14,background:"#fff4ea",color:"#8a4b2f"}}>This quote is too close to expiry for a new Stripe payment session. Please request a fresh quote.</p>:<ApprovedCheckoutButton quoteId={quote.id} enabled={live}/>}
   </div>
   <p style={{fontSize:12,color:"#708472",lineHeight:1.8,marginTop:20}}>After a verified Stripe payment, Herocon submits the order to BuckyDrop for merchant-funded fulfilment. BuckyDrop accepting an order does not mean it has already been paid for or shipped. You will receive a confirmation and tracking access once the order has been recorded. By continuing you acknowledge our <Link href="/terms-and-conditions">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</p>
  </section>
 </main>;
}
