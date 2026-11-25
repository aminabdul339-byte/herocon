import {NextResponse} from "next/server";
import {verifyStripeWebhook} from "@/lib/stripe-gateway";
import {orderFor,confirmTestPayment,testReady} from "@/lib/hiobuy-rehearsal";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:Request){
 const secret=process.env.HEROCON_HIOBUY_REHEARSAL_WEBHOOK_SECRET;
 if(!testReady()||!secret?.startsWith("whsec_"))return NextResponse.json({error:"Test webhook disabled"},{status:503});
 const raw=await req.text();if(raw.length>400000)return NextResponse.json({error:"Payload too large"},{status:413});
 let event;try{event=verifyStripeWebhook(raw,req.headers.get("stripe-signature"),secret);}catch{return NextResponse.json({error:"Invalid signature"},{status:400});}
 const s=event.data.object,m=s.metadata;
 if(event.livemode!==false||s.livemode!==false||!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)||s.payment_status!=="paid"||m?.purpose!=="herocon_hio_rehearsal")return NextResponse.json({received:true,ignored:true});
 if(!m.userId||!m.orderId||(m.stage!=="product"&&m.stage!=="shipping"))return NextResponse.json({error:"Invalid metadata"},{status:400});
 try{const order=await orderFor(m.userId,m.orderId);if(!order||order.mode!=="stripe_test")return NextResponse.json({error:"Unknown test order"},{status:400});await confirmTestPayment(order,m.stage);return NextResponse.json({received:true});}catch{return NextResponse.json({error:"Reconciliation required"},{status:503});}
}
