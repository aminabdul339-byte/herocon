import "server-only";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {productTotal,canPayShipping} from "@/lib/hiobuy-pricing";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";
type Obj=Record<string,unknown>;
export const obj=(x:unknown):Obj=>x&&typeof x==="object"&&!Array.isArray(x)?x as Obj:{};
export const str=(x:unknown)=>typeof x==="string"?x:"";
export const arr=(x:unknown):unknown[]=>Array.isArray(x)?x:[];
export const fen=(x:unknown)=>{const v=obj(x);if(v.currency!=="CNY"||typeof v.amount!=="number"||!Number.isSafeInteger(v.amount)||v.amount<0)throw Error("Unverified CNY amount");return v.amount;};
export class HioError extends Error{constructor(public code:string,public status:number){super(code);}}
async function call(path:string,body?:Obj,key?:string){
 const apiKey=process.env.HIOBUY_API_KEY?.trim();
 if(!apiKey)throw new HioError("HIOBUY_NOT_CONFIGURED",503);
 // All writes require a separately enabled pilot; this adapter is not a public mutation endpoint.
 if(key&&process.env.HEROCON_HIOBUY_WRITE_PILOT!=="true")throw new HioError("HIOBUY_WRITES_DISABLED",503);
 const res=await fetch("https://api.hiobuy.com/v1/"+path,{method:body?"POST":"GET",
  headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json",Language:"en",...(key?{"Idempotency-Key":key}:{})},
  ...(body?{body:JSON.stringify(body)}:{}),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(20000)});
 const data=obj(await res.json().catch(()=>null));
 if(!res.ok||data.success===false)throw new HioError(str(obj(data.error).code)||str(data.code)||"HIOBUY_REJECTED",res.status);
 return data;
}
const label=(v:unknown)=>str(obj(v).translated)||str(obj(v).original)||str(v);
export async function parseProduct(input:unknown){
 const url=normalizeMarketplaceLink(input);
 if(!url||!/^https:\/\/(detail\.1688\.com|item\.taobao\.com)\//.test(url))throw new HioError("UNSUPPORTED_PRODUCT_LINK",400);
 const raw=await call("products/parse",{url,language:"en"});
 const p=obj(raw.product);const channel=str(p.channel)||(url.includes("1688.com")?"1688":"taobao");
 const id=str(p.id);if(!id||!["1688","taobao"].includes(channel))throw new HioError("INVALID_PRODUCT",502);
 const variants=arr(p.variants).slice(0,500).map(v=>{const s=obj(v);return {id:str(s.sku_id),name:arr(s.attributes).map(a=>{const z=obj(a);return [str(z.translated_name)||str(z.original_name)||label(z.name),str(z.translated_value)||str(z.original_value)||label(z.value)].filter(Boolean).join(": ");}).join(" / ")||"Variant",stock:typeof s.stock==="number"?s.stock:null};}).filter(v=>v.id);
 return {url,id,channel,title:label(p.title)||"Marketplace product",minimum:typeof p.min_order_quantity==="number"?p.min_order_quantity:null,variants};
}
function receiver(){
 const r=obj(JSON.parse(process.env.HIOBUY_WAREHOUSE_RECEIVER_JSON||"{}"));
 for(const k of ["name","mobile","province","city","district","address"])if(!str(r[k]))throw new HioError("WAREHOUSE_RECEIVER_NOT_CONFIGURED",503);
 return r;
}
export async function quoteProduct(url:unknown,sku:unknown,quantity:unknown){
 const p=await parseProduct(url);
 if(typeof quantity!=="number"||!Number.isInteger(quantity)||quantity<1||quantity>99)throw new HioError("INVALID_QUANTITY",400);
 const v=p.variants.find(x=>x.id===sku);
 if(!v||v.stock===0||(v.stock!==null&&v.stock<quantity)||(p.minimum!==null&&quantity<p.minimum))throw new HioError("SKU_OR_QUANTITY_UNAVAILABLE",422);
 const body={channel:p.channel,...(p.channel==="1688"?{flow:"general"}:{}),receiver:receiver(),lines:[{id:p.id,spec_id:v.id,quantity}]};
 const raw=await call("orders/preview",body);
 if(raw.success!==true||arr(raw.unavailable_lines).length)throw new HioError("ORDER_PREVIEW_UNAVAILABLE",422);
 const total=obj(raw.total),goods=fen(total.merchandise),domestic=fen(total.shipping);
 const fx=await getReferenceCnyGbpRate();
 return {product:p.title,variant:v.name,quantity,cnyFen:{goods,domestic},...productTotal(goods,domestic,fx.rate),fxDate:fx.date,estimateOnly:true};
}
export async function connectionStatus(){
 const [balance,channels]=await Promise.allSettled([call("fulfillment/balance"),call("fulfillment/shipping/channels?country_code=GB&page_size=20")]);
 let availableFen:number|null=null;
 if(balance.status==="fulfilled")try{availableFen=fen(obj(balance.value.balance).available);}catch{}
 return {keyConfigured:!!process.env.HIOBUY_API_KEY,warehouseBalanceReadable:availableFen!==null,
  availableFen,shippingChannelsReadable:channels.status==="fulfilled",
  channels:channels.status==="fulfilled"?arr(channels.value.items).map(x=>{const c=obj(x);return {code:str(c.code),name:str(c.name)};}).filter(x=>x.code):[],
  balanceError:balance.status==="rejected"?(balance.reason instanceof HioError?balance.reason.code:"CONNECTION_FAILED"):null,
  channelsError:channels.status==="rejected"?(channels.reason instanceof HioError?channels.reason.code:"CONNECTION_FAILED"):null,
  receiverConfigured:!!process.env.HIOBUY_WAREHOUSE_RECEIVER_JSON,writesEnabled:false};
}
// Internal pilot primitives. These are deliberately not reachable from customer or Stripe routes
// until provider response contracts, ownership, durable payment claims and reconciliation are tested.
export async function procurementCreate(body:Obj,externalId:string){return call("orders/create",{...body,external_order_id:externalId},externalId);}
export async function procurementDetail(channel:string,id:string){return call("orders/detail",{channel,order_id:id});}
export async function procurementPay(channel:string,id:string,maximumFen:number,key:string){
 const detail=await procurementDetail(channel,id);
 if(fen(obj(detail.total).payment)>maximumFen)throw new HioError("COST_CHANGED",409);
 return call("orders/pay",{channel,order_id:id},key);
}
export async function packagesForOrder(externalId:string){return call("fulfillment/packages?external_order_id="+encodeURIComponent(externalId));}
export async function shippingQuotes(body:Obj){return call("fulfillment/shipping/quotes",body);}
export async function shipmentCreate(body:Obj,key:string){return call("fulfillment/shipments/create",body,key);}
export async function shipmentDetail(id:string){return call("fulfillment/shipments/"+encodeURIComponent(id));}
export async function shipmentPay(id:string,expectedFen:number,key:string){
 const detail=await shipmentDetail(id);const amount=fen(obj(detail.total).payment);
 if(amount!==expectedFen||!canPayShipping(str(detail.status),str(detail.payment_status),!!obj(detail.times).packed_at&&arr(detail.boxes).length>0,amount))throw new HioError("SHIPMENT_NOT_READY_OR_PRICE_CHANGED",409);
 const wallet=await call("fulfillment/balance");
 if(fen(obj(wallet.balance).available)<amount)throw new HioError("INSUFFICIENT_BALANCE",402);
 return call("fulfillment/shipments/"+encodeURIComponent(id)+"/pay",{},key);
}
