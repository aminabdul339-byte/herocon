import "server-only";
import {get,put,list} from "@vercel/blob";
import {sequence,verifyEvent,stageFor,productPence,shippingAmount,verifiedTestPayment,type Event,type EventName} from "@/lib/hiobuy-rehearsal-model";
const ROOT="hiobuy/rehearsal/v1/";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export type Order={id:string;userId:string;mode:"mock"|"stripe_test";createdAt:string;events:Event[]};
export class RehearsalError extends Error{constructor(public status:number,message:string){super(message);}}
const prefix=(uid:string,id:string)=>{if(!uuid.test(uid)||!uuid.test(id))throw new RehearsalError(400,"Invalid reference");return ROOT+uid+"/"+id+"/";};
async function read<T>(path:string):Promise<T|null>{
 const r=await get(path,{access:"private",useCache:false});if(!r)return null;
 if(r.statusCode!==200||!r.stream)throw new RehearsalError(503,"Private storage unavailable");
 return JSON.parse(await new Response(r.stream).text()) as T;
}
async function immutable<T>(path:string,value:T):Promise<T>{
 try{await put(path,JSON.stringify(value),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});return value;}
 catch{const prior=await read<T>(path);if(prior)return prior;throw new RehearsalError(503,"Private storage unavailable");}
}
export async function orderFor(uid:string,id:string):Promise<Order|null>{
 const p=prefix(uid,id);const order=await read<Omit<Order,"events">>(p+"order.json");if(!order)return null;
 if(order.userId!==uid||order.id!==id||!["mock","stripe_test"].includes(order.mode))throw new RehearsalError(503,"Invalid stored order");
 let events:Event[]=[];
 for(const name of sequence){const event=await read<Event>(p+name+".json");if(!event)break;events=verifyEvent(events,event);}
 return {...order,events};
}
export async function ordersFor(uid:string){
 if(!uuid.test(uid))throw new RehearsalError(400,"Invalid account");
 const r=await list({prefix:ROOT+uid+"/",limit:1000});const ids=r.blobs.filter(b=>b.pathname.endsWith("/order.json")).map(b=>b.pathname.split("/").at(-2)!).slice(-30);
 const orders=await Promise.all(ids.map(id=>orderFor(uid,id)));return orders.filter((o):o is Order=>o!==null).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function createOrder(uid:string,id:string,mode:unknown){
 if(mode!=="mock"&&mode!=="stripe_test")throw new RehearsalError(400,"Invalid rehearsal mode");
 if(mode==="stripe_test"&&!testReady())throw new RehearsalError(503,"Stripe test key not configured");
 const saved=await immutable(prefix(uid,id)+"order.json",{id,userId:uid,mode,createdAt:new Date().toISOString()});
 if(saved.mode!==mode)throw new RehearsalError(409,"Order already exists with another mode");
 return (await orderFor(uid,id))!;
}
export async function addEvent(order:Order,name:EventName,extra:Partial<Event>={}){
 const existing=order.events.find(x=>x.name===name);if(existing)return order;
 const event:Event={...extra,name,at:new Date().toISOString()};
 try{verifyEvent(order.events,event);}catch{throw new RehearsalError(409,"Order is not ready for that action");}
 const recorded=await immutable(prefix(order.userId,order.id)+name+".json",event);
 if(recorded.line!==event.line||recorded.amountPence!==event.amountPence||recorded.sessionId!==event.sessionId)throw new RehearsalError(409,"Another action has already been recorded. Refresh the order.");
 return (await orderFor(order.userId,order.id))!;
}
export const testReady=()=>!!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")&&process.env.HEROCON_HIOBUY_REHEARSAL_STRIPE_ENABLED==="true";
function testKey(){if(!testReady())throw new RehearsalError(503,"Stripe test checkout is disabled");return process.env.STRIPE_SECRET_KEY!;}
function paymentAmount(order:Order,stage:"product"|"shipping"){
 return stage==="product"?productPence:shippingAmount(order.events.find(x=>x.name==="packing")?.line);
}
const eventName=(stage:"product"|"shipping")=>stage==="product"?"product-paid":"shipping-paid";
function paymentStage(order:Order,stage:"product"|"shipping"){
 if(stageFor(order.events)!==(stage==="product"?"products":"shipping"))throw new RehearsalError(409,"Payment is not due");
}
export async function mockPay(order:Order,stage:"product"|"shipping"){
 if(order.mode!=="mock")throw new RehearsalError(403,"This order requires Stripe test payment");
 if(order.events.some(x=>x.name===eventName(stage)))return order;
 paymentStage(order,stage);return addEvent(order,eventName(stage),{amountPence:paymentAmount(order,stage)});
}
async function stripe(path:string,params?:URLSearchParams,idempotency?:string){
 const key=testKey();const r=await fetch("https://api.stripe.com/v1/checkout/sessions"+path,{method:params?"POST":"GET",headers:{Authorization:"Bearer "+key,...(params?{"Content-Type":"application/x-www-form-urlencoded"}:{}),...(idempotency?{"Idempotency-Key":idempotency}:{})},...(params?{body:params}:{}),redirect:"error",cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new RehearsalError(502,"Stripe test request rejected");return await r.json() as Record<string,any>;
}
export async function startTestPayment(order:Order,stage:"product"|"shipping",origin:string){
 if(order.mode!=="stripe_test")throw new RehearsalError(403,"Not a Stripe test order");
 paymentStage(order,stage);const p=prefix(order.userId,order.id)+stage+"-session.json";
 const old=await read<{id:string}>(p);if(old){const s=await stripe("/"+encodeURIComponent(old.id));if(s.status==="open"&&s.livemode===false&&typeof s.url==="string"&&s.url.startsWith("https://checkout.stripe.com/"))return s.url;throw new RehearsalError(409,"Existing test session is closed. Verify payment or start a new rehearsal.");}
 // Persist a fixed expiration before contacting Stripe; retries cannot create a fresh payment
 // after the provider's idempotency retention window.
 const intent=await immutable(prefix(order.userId,order.id)+stage+"-intent.json",{createdAt:Math.floor(Date.now()/1000),origin});
 if(Math.floor(Date.now()/1000)-intent.createdAt>3600)throw new RehearsalError(409,"Test checkout expired; create a new rehearsal.");
 const values=new URLSearchParams({mode:"payment","payment_method_types[0]":"card","line_items[0][price_data][currency]":"gbp","line_items[0][price_data][unit_amount]":String(paymentAmount(order,stage)),"line_items[0][price_data][product_data][name]":"HEROCON TEST ONLY – "+stage,"line_items[0][quantity]":"1","metadata[purpose]":"herocon_hio_rehearsal","metadata[orderId]":order.id,"metadata[userId]":order.userId,"metadata[stage]":stage,success_url:intent.origin+"/warehouse/rehearsal?order="+order.id,cancel_url:intent.origin+"/warehouse/rehearsal?order="+order.id,expires_at:String(intent.createdAt+7200)});
 const s=await stripe("",values,"hio-rehearsal-"+order.id+"-"+stage);
 if(s.livemode!==false||typeof s.id!=="string"||!s.id.startsWith("cs_test_")||typeof s.url!=="string"||!s.url.startsWith("https://checkout.stripe.com/"))throw new RehearsalError(502,"Invalid Stripe test session");
 const saved=await immutable(p,{id:s.id});if(saved.id!==s.id)throw new RehearsalError(409,"Conflicting test payment session");return s.url;
}
export async function confirmTestPayment(order:Order,stage:"product"|"shipping"){
 if(order.mode!=="stripe_test")throw new RehearsalError(403,"Not a Stripe test order");
 if(order.events.some(x=>x.name===eventName(stage)))return order;
 paymentStage(order,stage);
 const saved=await read<{id:string}>(prefix(order.userId,order.id)+stage+"-session.json");
 if(!saved||!saved.id.startsWith("cs_test_"))throw new RehearsalError(409,"No test session recorded");
 const session=await stripe("/"+encodeURIComponent(saved.id));
 if(session.id!==saved.id||!verifiedTestPayment(session,{id:order.id,userId:order.userId,stage,amount:paymentAmount(order,stage)}))throw new RehearsalError(409,"Test payment has not been verified");
 return addEvent(order,eventName(stage),{amountPence:paymentAmount(order,stage),sessionId:session.id});
}
