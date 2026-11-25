import {NextResponse} from "next/server";
import {get,put} from "@vercel/blob";
import {verifyHioWebhook} from "@/lib/hiobuy-webhook-signature";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=15;
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
/** Durable receipt only. Never mutates order status or sends funds. A production
 * reconciliation worker must map provider IDs to owned orders before consuming events. */
export async function POST(req:Request){
 const secret=process.env.HIOBUY_WEBHOOK_SECRET||"",appId=process.env.HIOBUY_APP_ID||"";
 if(!secret||!appId||!process.env.BLOB_READ_WRITE_TOKEN)return response({error:"Webhook inbox not configured"},503);
 const raw=await req.text();if(Buffer.byteLength(raw)>65536)return response({error:"Payload too large"},413);
 let event;try{event=verifyHioWebhook(raw,req.headers.get("HioBuy-Signature"),secret,appId);}catch{return response({error:"Invalid signature or event"},400);}
 const headerId=req.headers.get("HioBuy-Event-Id");if(headerId&&headerId!==event.id)return response({error:"Event ID mismatch"},400);
 if(event.livemode&&process.env.HEROCON_HIOBUY_LIVE_EVENT_INBOX!=="true")return response({error:"Live event inbox disabled"},503);
 const path="hiobuy/webhook-inbox/v1/"+(event.livemode?"live":"test")+"/"+event.id+".json";
 try{await put(path,JSON.stringify({receivedAt:new Date().toISOString(),state:"pending_reconciliation",event}),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});}
 catch{try{const r=await get(path,{access:"private",useCache:false});if(!r||r.statusCode!==200||!r.stream)throw Error("Missing receipt");const prior=JSON.parse(await new Response(r.stream).text());if(prior.event?.id!==event.id||prior.event?.app_id!==appId||prior.event?.type!==event.type)return response({error:"Conflicting event"},409);return response({received:true,duplicate:true});}catch{return response({error:"Receipt storage unavailable"},503);}}
 return response({received:true,pendingReconciliation:true});
}
