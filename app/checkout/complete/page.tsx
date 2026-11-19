import Header from "@/components/Header";
import Link from "next/link";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Checkout return",robots:{index:false,follow:false}};
export default function CheckoutReturn(){
 return <main style={{minHeight:"65vh",background:"#f7f9f4"}}>
  <Header/>
  <section style={{maxWidth:730,padding:"110px 24px",margin:"auto",color:"#274b35",textAlign:"center"}}>
   <p style={{fontSize:11,fontWeight:800,letterSpacing:".17em"}}>HEROCON / PAYMENT RETURN</p>
   <h1 style={{font:"400 clamp(40px,5vw,62px)/1.1 Georgia,serif"}}>Thank you for visiting <em>checkout.</em></h1>
   <p style={{fontSize:15,lineHeight:1.9,color:"#617966"}}>We are verifying your payment and order with Stripe. Returning from checkout is not proof that the payment has completed. If payment succeeded, you will receive a confirmation by email. BuckyDrop fulfilment begins only after your order is submitted and the merchant funds it.</p>
   <p style={{fontSize:13}}>Need help? <Link href="/contact">Contact the Herocon team</Link>.</p>
   <Link href="/search" style={{display:"inline-block",marginTop:30,padding:"16px 25px",background:"#244c32",color:"#fff",borderRadius:4,textDecoration:"none"}}>Continue exploring products</Link>
  </section>
 </main>;
}
