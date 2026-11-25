import "server-only";
import {get,put,list} from "@vercel/blob";
import {createHash,randomUUID} from "node:crypto";
import {nextStage,notices,type Stage} from "@/lib/hiobuy-test-lifecycle";
export type Line={title:string;variant:string;quantity:number;priceFen:number;sourceUrl:string;productId:string;skuId:string;channel:string};
export type TestOrder={id:string;createdAt:string;lines:Line[];productFen:number;shippingFen:number|null;stage:Stage;events:{stage:Exclude<Stage,"draft">;at:string;subject:string;body:string}[];quoteMode:"provider_preview"|"simulation";shippingMode:"provider_estimate"|"simulation"|null;version:1;mode:"simulation"};
const prefix=(owner:string)=>"owner-tests/orders/v1/"+createHash("sha256").update(owner).digest("hex")+"/";
const valid=(id:string)=>/^HC-TEST-[A-F0-9]{24}$/.test(id);
async function read(path:string){try{const b=await get(path,{access:"private"});if(!b||b.statusCode!==200||!b.stream)return null;return JSON.parse(await new Response(b.stream).text()) as TestOrder;}catch{return null;}}
export async function getTestOrder(owner:string,id:string){if(!valid(id))return null;const root=prefix(owner)+id+"/";const records=await list({prefix:root,limit:30});const files=records.blobs.filter(x=>/\/\d{2}\.json$/.test(x.pathname)).sort((a,b)=>b.pathname.localeCompare(a.pathname));return files.length?read(files[0].pathname):null;}
export async function listTestOrders(owner:string){const page=await list({prefix:prefix(owner),limit:1000});const ids=[...new Set(page.blobs.map(b=>b.pathname.slice(prefix(owner).length).split("/")[0]).filter(valid))];const orders=await Promise.all(ids.slice(-100).map(id=>getTestOrder(owner,id)));return orders.filter((x):x is TestOrder=>!!x).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
export async function createTestOrder(owner:string,lines:Line[],productFen:number,quoteMode:TestOrder["quoteMode"],attempt:string){
 if(!/^[a-f0-9-]{36}$/i.test(attempt))throw Error("Invalid checkout session.");
 const id="HC-TEST-"+createHash("sha256").update(owner+":"+attempt).digest("hex").slice(0,24).toUpperCase();
 const existing=await getTestOrder(owner,id);if(existing)return existing;
 const at=new Date().toISOString(),stage="products_paid";
 const order:TestOrder={id,createdAt:at,lines,productFen,shippingFen:null,stage,events:[{stage,at,...notices[stage]}],quoteMode,shippingMode:null,version:1,mode:"simulation"};
 try{await put(prefix(owner)+id+"/01.json",JSON.stringify(order),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});}catch{const previous=await getTestOrder(owner,id);if(previous)return previous;throw Error("Test order storage is unavailable.");}return order;
}
export async function advanceTestOrder(owner:string,id:string,expected:Stage,shippingFen:number|null,shippingMode:TestOrder["shippingMode"]){const order=await getTestOrder(owner,id);if(!order)throw Error("Order not found.");if(order.stage!==expected)return order;const stage=nextStage(order.stage);if(!stage||stage==="draft")return order;if(stage==="shipping_due"&&(!Number.isSafeInteger(shippingFen)||shippingFen===null||shippingFen<0||shippingFen>100000000))throw Error("Choose a shipping estimate first.");const next:TestOrder={...order,stage,shippingFen:stage==="shipping_due"?shippingFen:order.shippingFen,shippingMode:stage==="shipping_due"?shippingMode:order.shippingMode,events:[...order.events,{stage,at:new Date().toISOString(),...notices[stage]}]};try{await put(prefix(owner)+id+"/"+String(next.events.length).padStart(2,"0")+".json",JSON.stringify(next),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});}catch{const current=await getTestOrder(owner,id);if(current&&current.stage!==expected)return current;throw Error("Test order update failed.");}return next;}
