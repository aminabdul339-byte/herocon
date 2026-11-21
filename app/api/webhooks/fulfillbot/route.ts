import {NextResponse} from "next/server";
import {partnerKeyConfigured,partnerRead,PartnerReadError,type PartnerReadResource} from "@/lib/fulfillbot-read";
import {verifyPartnerWebhook} from "@/lib/fulfillbot-webhook";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const sources:Readonly<Record<string,PartnerReadResource>>={
  "order.status_changed":"orders",
  "order.awaiting_payment":"orders",
  "purchase_order.status_changed":"purchase-orders",
  "shipment.status_changed":"shipments",
  "shipment.tracking_updated":"shipments",
  "quote.created":"quotes",
};

export async function GET(){
  return NextResponse.json({ok:true,service:"partner webhook receiver",method:"POST required"}, {headers});
}

export async function POST(request:Request){
  const secret=process.env.FULFILLBOT_WEBHOOK_SECRET?.trim();
  if(!secret)return NextResponse.json({ok:false,error:"not_configured"},{status:503,headers});
  if(!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return NextResponse.json({ok:false,error:"invalid_content_type"},{status:415,headers});
  const len=Number(request.headers.get("content-length")||0);
  if(len>65536)return NextResponse.json({ok:false,error:"too_large"},{status:413,headers});
  let raw:Buffer;
  try{
    raw=Buffer.from(await request.arrayBuffer());
    if(!raw.length||raw.length>65536)throw Error("invalid_size");
  }catch{return NextResponse.json({ok:false,error:"invalid_body"},{status:400,headers});}
  if(!verifyPartnerWebhook(raw,request.headers.get("x-webhook-signature"),secret,request.headers))
    return NextResponse.json({ok:false,error:"invalid_signature"},{status:401,headers});
  let event:Record<string,unknown>;
  try {
    const decoded=JSON.parse(raw.toString("utf8"));
    if(!decoded||typeof decoded!=="object"||Array.isArray(decoded))throw Error("invalid_event");
    event=decoded as Record<string,unknown>;
  }catch{
    return NextResponse.json({ok:false,error:"invalid_json"},{status:400,headers});
  }
  const type=typeof event.type==="string"?event.type:typeof event.event==="string"?event.event:"";
  const nested=event.data&&typeof event.data==="object"&&!Array.isArray(event.data)
    ?event.data as Record<string,unknown>:null;
  const itemId=event.id??nested?.id??event.resourceId;
  // No user/customer data is logged or returned in the webhook response.
  if(type==="wallet.top_up_approved")return NextResponse.json({ok:true,accepted:true},{headers});
  const resource=sources[type];
  if(!resource)return NextResponse.json({ok:true,accepted:true,ignored:true},{headers});
  if(typeof itemId!=="string"||!(/^[a-zA-Z0-9_-]{5,128}$/.test(itemId)))
    return NextResponse.json({ok:false,error:"invalid_resource_id"},{status:422,headers});
  if(!partnerKeyConfigured())
    return NextResponse.json({ok:false,error:"partner_key_not_configured"},{status:503,headers});
  try {
    // Read-only confirmation from the upstream account. We deliberately
    // do not purchase, change inventory, create orders or modify shipping.
    await partnerRead(resource,{id:itemId});
    return NextResponse.json({ok:true,accepted:true},{headers});
  }catch(error){
    const code=error instanceof PartnerReadError?error.code:"partner_unavailable";
    return NextResponse.json({ok:false,error:code},{status:503,headers});
  }
}
