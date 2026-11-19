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
   <p>Your quote covers the products only. Our partner purchases and stores them at its warehouse in China. International shipping is quoted and paid separately before dispatch.</p>
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
     <p style={{display:"flex",justifyContent:"space-between"}}><span>International shipping charged now</span><strong>£0.00 — paid later</strong></p>
     <p style={{display:"flex",justifyContent:"space-between",color:"#86633e"}}><span>Indicative shipping estimate (not charged)</span><strong>≈ {money(quote.estimatedLaterShippingPence||0)}</strong></p>
     <p style={{display:"flex",justifyContent:"space-between"}}><span>Product-stage tax charged now</span><strong>{money(quote.taxPence)}</strong></p>
     <p style={{display:"flex",justifyContent:"space-between",paddingTop:18,borderTop:"1px solid #bdcfbd",fontSize:21}}><strong>Pay now (products)</strong><strong>{money(quote.totalPence)}</strong></p>
    </div>
    <p style={{fontSize:12,color:"#708472"}}>This quote expires on {new Date(quote.expiresAt).toLocaleString("en-GB",{timeZone:"Europe/London"})} (UK time). An expired quote must be approved again.</p>
    <p style={{fontSize:13,lineHeight:1.7,padding:15,background:"#fff8eb",color:"#74522f",borderRadius:6}}><strong>Shipping is separate.</strong> The estimate above is not a final charge. Delivery costs depend on packed weight, destination and service. Shipping is payable before dispatch. <Link href="/contact">Contact support</Link> about cancellation or refund options.</p>
    {expired?<p role="status" style={{padding:14,background:"#fff4ea",color:"#8a4b2f"}}>This quote is too close to expiry for a new Stripe payment session. Please request a fresh quote.</p>:<ApprovedCheckoutButton quoteId={quote.id} enabled={live}/>}
   </div>
   <p style={{fontSize:12,color:"#708472",lineHeight:1.8,marginTop:20}}>Online checkout is currently unavailable. Once enabled, product payments and international shipping will be separate. See our <Link href="/terms-and-conditions">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</p>
  </section>
 </main>;
}
