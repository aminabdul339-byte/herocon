import {NextResponse} from "next/server";
import {authorizedCheckoutAdmin,createApprovedQuote,QuoteError} from "@/lib/approved-checkout";
import {checkoutLaunchReadiness} from "@/lib/live-checkout";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const answer=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}});
function authenticated(request:Request){return authorizedCheckoutAdmin(request.headers.get("x-herocon-checkout-admin"));}
export async function GET(request:Request){
 if(!authenticated(request))return answer({error:"Unauthorized"},401);
 return answer({readiness:checkoutLaunchReadiness()});
}
export async function POST(request:Request){
 if(!authenticated(request))return answer({error:"Unauthorized"},401);
 const origin=request.headers.get("origin");
 try{
  if(!origin||new URL(origin).origin!==new URL(request.url).origin)
   return answer({error:"Invalid request origin"},403);
 }catch{return answer({error:"Invalid origin"},403);}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return answer({error:"JSON required"},415);
 let input:unknown;
 try{
  const raw=await request.text();
  if(raw.length>12000)return answer({error:"Request too large"},413);
  input=JSON.parse(raw);
 }catch{return answer({error:"Invalid JSON request"},400);}
 try{
  const quote=await createApprovedQuote(input);
  return answer({
   id:quote.id,customerEmail:quote.customerEmail,totalGBP:(quote.totalPence/100).toFixed(2),
   paymentStage:"products",estimatedLaterShippingGBP:((quote.estimatedLaterShippingPence||0)/100).toFixed(2),
   expiresAt:quote.expiresAt,checkoutUrl:"https://herocon.store/checkout/"+quote.id,
   paymentEnabled:checkoutLaunchReadiness().enabled,
   notice:"Share this private link only with the intended buyer. Supplier checks can incur BuckyDrop fees. Live charges remain disabled until all launch requirements are verified."
  },201);
 }catch(e){return answer({error:e instanceof QuoteError?e.message:"Could not create a verified quote."},e instanceof QuoteError?e.status:502);}
}
