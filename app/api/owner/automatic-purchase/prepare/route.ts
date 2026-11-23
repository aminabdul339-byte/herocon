import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {createAutomaticOwnerQuote,QuoteError} from "@/lib/approved-checkout";
import {ownerAutoPilotConfigured} from "@/lib/owner-auto-price";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
const respond=(x:unknown,status=200)=>NextResponse.json(x,{status,headers});
const recent=new Map<string,number>();
export async function POST(request:Request){
 if(!accountOriginValid(request))return respond({error:"Invalid origin."},403);
 const customer=await currentCustomer();
 if(!customer||!isOwnerPremiumCustomer(customer))return respond({error:"Owner Premium sign-in required."},403);
 if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))
  return respond({error:"JSON required."},415);
 const ready=ownerAutoPilotConfigured();
 if(!ready.enabled)return respond({error:"Automatic checkout pricing is not configured for the private pilot. The merchant must approve the BuckyDrop wallet, shipping, tax and fee budgets first.",missing:ready.missing},503);
 const now=Date.now(),previous=recent.get(customer.id)||0;
 if(previous&&now-previous<12000)return respond({error:"Please avoid repeated checkout requests."},429);
 recent.set(customer.id,now);
 let input:unknown;
 try{
  const raw=await request.text();
  if(raw.length>500)return respond({error:"Request too large."},413);
  input=JSON.parse(raw);
 }catch{return respond({error:"Invalid checkout selection."},400);}
 const d=input&&typeof input==="object"&&!Array.isArray(input)?input as Record<string,unknown>:{};
 const productId=d.productId,skuCode=d.skuCode,quantity=d.quantity;
 if(typeof productId!=="string"||typeof skuCode!=="string"||
   typeof quantity!=="number"||!Number.isInteger(quantity))
  return respond({error:"Select a saved product variant and quantity."},400);
 try{
  const quote=await createAutomaticOwnerQuote({productId,skuCode,quantity},customer.email);
  return respond({
   checkoutUrl:"/checkout/"+quote.id,checkoutId:quote.id,
   customerTotalGBP:(quote.totalPence/100).toFixed(2),
   shippingGBP:(quote.shippingPence/100).toFixed(2),
   serviceFeeGBP:"0.99",
   pricingSource:"saved_buckydrop_supplier_snapshot",
   noManualQuote:true,
   livePaymentReady:false,
   note:"This review is not proof Stripe live payments and the BuckyDrop wallet automated purchase are enabled."
  },201);
 }catch(e){
  if(e instanceof QuoteError)return respond({error:e.message},e.status);
  return respond({error:"Could not create a secure automatic purchase."},503);
 }
}
