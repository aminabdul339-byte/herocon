import "server-only";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {productTotal,canPayShipping} from "@/lib/hiobuy-pricing";
import {groupProcurementLines, extractCreatedOrderIds} from "@/lib/hiobuy-order-groups";
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
 const id=str(p.source_product_id),sellerId=str(obj(p.seller).id);if(!id||!sellerId||!["1688","taobao"].includes(channel))throw new HioError("INVALID_PRODUCT",502);
 const variants=arr(p.variants).slice(0,500).map(v=>{const s=obj(v);return {id:str(s.sku_id),name:arr(s.attributes).map(a=>{const z=obj(a);return [str(z.translated_name)||str(z.original_name)||label(z.name),str(z.translated_value)||str(z.original_value)||label(z.value)].filter(Boolean).join(": ");}).join(" / ")||"Variant",stock:typeof s.stock==="number"&&Number.isSafeInteger(s.stock)&&s.stock>=0?s.stock:null,minimum:typeof s.min_order_quantity==="number"?s.min_order_quantity:null,priceCny:(()=>{const price=obj(s.price);const v=price.promotion_amount??price.display_amount;return typeof v==="number"&&Number.isFinite(v)&&v>0?v:null;})()};}).filter(v=>v.id);
 return {url,id,channel:channel as "1688"|"taobao",sellerId,sellerName:str(obj(p.seller).name),title:label(p.title)||"Marketplace product",minimum:typeof p.min_order_quantity==="number"?p.min_order_quantity:null,variants};
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
 if(!v||v.stock===null||v.stock<quantity||(p.minimum!==null&&quantity<p.minimum))throw new HioError("SKU_OR_QUANTITY_UNAVAILABLE",422);
 const body={channel:p.channel,...(p.channel==="1688"?{flow:"general"}:{}),receiver:receiver(),lines:[{offer_id:p.id,spec_id:v.id,quantity}]};
 const raw=await call("orders/preview",body);
 if(raw.success!==true||arr(raw.unavailable_lines).length)throw new HioError("ORDER_PREVIEW_UNAVAILABLE",422);
 const total=obj(raw.total),goods=fen(total.merchandise),domestic=fen(total.shipping); // Explicit merchandise amount required; never infer goods from a possibly fee-inclusive payable total.
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
export async function procurementCreate(group:ReturnType<typeof groupProcurementLines>[number],externalId:string){
 const raw=await call("orders/create",{channel:group.channel,...(group.channel==="1688"?{flow:"general"}:{}),receiver:receiver(),lines:group.lines.map(l=>({offer_id:l.offerId,spec_id:l.skuId,quantity:l.quantity})),external_order_id:externalId},externalId);
 // Preserve every returned identifier even if the provider reports a partial result.
 return {raw,orderIds:extractCreatedOrderIds(raw),requiresReconciliation:raw.success!==true||arr(raw.failed_offers).length>0};
}
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

/** Owner-only read-only cart quote. All identifiers and prices are re-resolved
 * from the current source URL; no customer amounts or display seller names trusted. */
export async function quoteCart(input:unknown){
 if(!Array.isArray(input)||input.length<1||input.length>5)throw new HioError("SELECT_ONE_TO_FIVE_LINES",400);
 const cache=new Map<string,Awaited<ReturnType<typeof parseProduct>>>();
 const selected:{url:string;title:string;variant:string;channel:"1688"|"taobao";sellerId:string;sellerName:string;offerId:string;skuId:string;quantity:number;stock:number;minimum:number|null}[]=[];
 for(const value of input){
  const row=obj(value),url=normalizeMarketplaceLink(row.url),quantity=row.quantity;
  if(!url||typeof quantity!=="number"||!Number.isSafeInteger(quantity)||quantity<1||quantity>99||!str(row.sku))throw new HioError("EXACT_SKU_AND_QUANTITY_REQUIRED",400);
  let p=cache.get(url);if(!p){p=await parseProduct(url);cache.set(url,p);}
  const sku=p.variants.find(v=>v.id===row.sku);
  if(!sku||sku.stock===null||sku.stock<quantity)throw new HioError("SKU_STOCK_NOT_VERIFIED",409);
  selected.push({url,title:p.title,variant:sku.name,channel:p.channel,sellerId:p.sellerId,sellerName:p.sellerName,offerId:p.id,skuId:sku.id,quantity,stock:sku.stock,minimum:sku.minimum??p.minimum});
 }
 const groups=groupProcurementLines(selected);
 for(const group of groups)for(const l of group.lines){
  const matched=selected.find(v=>v.channel===group.channel&&v.sellerId===group.sellerId&&v.offerId===l.offerId&&v.skuId===l.skuId)!;
  if(l.quantity>matched.stock)throw new HioError("COMBINED_QUANTITY_EXCEEDS_STOCK",409);
  const total=group.lines.filter(x=>x.offerId===l.offerId).reduce((n,x)=>n+x.quantity,0);
  if(matched.minimum!==null&&total<matched.minimum)throw new HioError("MINIMUM_QUANTITY_NOT_MET",409);
 }
 const address=receiver();
 const quotes=await Promise.all(groups.map(async group=>{
  const raw=await call("orders/preview",{channel:group.channel,...(group.channel==="1688"?{flow:"general"}:{}),receiver:address,lines:group.lines.map(l=>({offer_id:l.offerId,spec_id:l.skuId,quantity:l.quantity}))});
  if(raw.success!==true||arr(raw.unavailable_lines).length)throw new HioError("GROUP_QUOTE_UNAVAILABLE",409);
  const sellers=arr(raw.sellers).map(obj);
  if(sellers.length!==1||str(sellers[0].seller_id)!==group.sellerId)throw new HioError("GROUP_SELLER_NOT_VERIFIED",409);
  const total=obj(raw.total),goods=fen(total.merchandise),domestic=fen(total.shipping);
  if(goods<=0)throw new HioError("INVALID_GOODS_COST",409);
  return {channel:group.channel,sellerId:group.sellerId,sellerName:selected.find(x=>x.channel===group.channel&&x.sellerId===group.sellerId)?.sellerName,goodsFen:goods,domesticFen:domestic,lines:group.lines.length};
 }));
 const fx=await getReferenceCnyGbpRate();
 const goods=quotes.reduce((n,x)=>n+x.goodsFen,0),domestic=quotes.reduce((n,x)=>n+x.domesticFen,0);
 return {groups:quotes,lines:selected.map(({stock,minimum,...x})=>x),...productTotal(goods,domestic,fx.rate),fxDate:fx.date,estimateOnly:true,internationalShippingIncluded:false};
}
