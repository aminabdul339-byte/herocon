import Link from "next/link";
import Header from "@/components/Header";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import OwnerBulkCheckoutReview from "@/components/OwnerBulkCheckoutReview";
import type {Metadata} from "next";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Owner Premium — Buy selected items | Herocon",
 robots:{index:false,follow:false}
};

/** No public customer is allowed into the pilot checkout review.
 * The client provides selections for display only; real purchasing and all
 * GBP prices must always be reconstructed and verified server-side. */
export default async function OwnerBulkCheckoutPage(){
 const account=await currentCustomer();
 const owner=isOwnerPremiumCustomer(account);
 return <main style={{minHeight:"100vh",background:"#f8f8f4",color:"#284632"}}>
  <Header/>
  {!owner?
   <section style={{maxWidth:800,margin:"auto",padding:"74px 24px 110px"}}>
    <p style={{letterSpacing:2,fontSize:11,fontWeight:800,color:"#69836f"}}>HEROCON / PRIVATE PURCHASING</p>
    <h1 style={{font:"400 clamp(38px,6vw,62px)/1.1 Georgia,serif",letterSpacing:"-.04em"}}>Owner-only purchasing.</h1>
    <p style={{fontSize:15,lineHeight:1.8,maxWidth:620}}>This bulk purchase review is reserved for the verified Herocon Owner Premium account. Other accounts can still save products in their carts but cannot initiate checkout.</p>
    <Link href={"/account?next="+encodeURIComponent("/pilot/buckydrop/bulk")} style={{color:"#245b38",textDecoration:"underline",fontWeight:700}}>Sign in with the owner account</Link>
   </section>:
   <OwnerBulkCheckoutReview/>}
 </main>;
}
