import "server-only";
import {get,put,list} from "@vercel/blob";
import {createHash} from "node:crypto";
import {listTestOrders,type TestOrder} from "@/lib/owner-test-order";
import {emptyAccount,applyTestAction,safeImage,type AccountState,type TestAction,type AccountItem,type Parcel} from "@/lib/shopping-account-model";
const root=(uid:string,mode:AccountState["mode"])=>"shopping-account/v1/"+mode+"/"+createHash("sha256").update(uid).digest("hex")+"/";
const filename=(rev:number)=>String(rev).padStart(8,"0")+".json";
async function snapshot(uid:string,mode:AccountState["mode"]):Promise<AccountState>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error("Account storage unavailable.");
 const prefix=root(uid,mode);let cursor:string|undefined;let latest="";let pages=0;
 do{const page=await list({prefix,limit:1000,...(cursor?{cursor}:{})});for(const b of page.blobs)if(/^\d{8}\.json$/.test(b.pathname.slice(prefix.length))&&b.pathname>latest)latest=b.pathname;cursor=page.hasMore?page.cursor:undefined;if(++pages>20)throw Error("Account storage requires maintenance.");}while(cursor);
 if(!latest)return emptyAccount(mode);
 const b=await get(latest,{access:"private",useCache:false});if(!b||b.statusCode!==200||!b.stream)throw Error("Account record unavailable.");
 const s=JSON.parse(await new Response(b.stream).text()) as AccountState;
 if(s.version!==1||s.mode!==mode||latest!==prefix+filename(s.revision)||!Array.isArray(s.orders)||!Array.isArray(s.items)||!Array.isArray(s.parcels)||!Array.isArray(s.updates)||!Array.isArray(s.requests))throw Error("Invalid account record.");return s;
}
function importLegacy(state:AccountState,legacy:TestOrder[]):AccountState{
 for(const o of legacy){if(o.mode!=="simulation"||state.orders.some(p=>p.id===o.id))continue;
 const stage=o.stage,parcelId="P-"+o.id,packed=["packing","shipping_due","shipping_paid","shipped","delivered"].includes(stage),paid=["shipping_paid","shipped","delivered"].includes(stage);
 const status:AccountItem["status"]=paid?"parcel":packed?"reserved":stage==="warehouse_received"?"warehouse":stage==="purchased"?"incoming":"purchased";
 const items:AccountItem[]=o.lines.map((l,i)=>({id:o.id+"-"+i,orderId:o.id,title:l.title,variant:l.variant,quantity:l.quantity,unitMinor:l.priceFen,currency:"CNY",image:safeImage(l.image),productPath:l.productPath,status,...(packed?{parcelId}:{})}));
 state.orders.push({id:o.id,createdAt:o.createdAt,amountMinor:o.productFen,currency:"CNY",itemIds:items.map(i=>i.id),feeMinor:o.breakdown?.feeMinor,domesticMinor:o.breakdown?.domesticMinor});state.items.push(...items);
 if(packed)state.parcels.push({id:parcelId,createdAt:o.createdAt,itemIds:items.map(i=>i.id),status:stage as Parcel["status"],currency:"CNY",...(o.shippingFen!==null?{shippingMinor:o.shippingFen}:{}),...(stage==="shipped"||stage==="delivered"?{tracking:"TEST-"+o.id.slice(-8)}:{})});
 for(const e of o.events)state.updates.push({id:o.id+"-"+e.stage,at:e.at,reference:o.id,text:e.subject});
 }
 state.updates.sort((a,b)=>b.at.localeCompare(a.at));return state;
}
export async function readShoppingAccount(uid:string,mode:AccountState["mode"]){const s=await snapshot(uid,mode);return mode==="test"?importLegacy(s,await listTestOrders(uid)):s;}
export async function updateTestAccount(uid:string,revision:number,action:TestAction,actionId:string){
 const s=await readShoppingAccount(uid,"test");if(s.lastAction===actionId)return s;if(s.revision!==revision)throw Error("Account changed. Refresh and retry.");
 const next=applyTestAction(s,action,new Date().toISOString(),actionId);try{await put(root(uid,"test")+filename(next.revision),JSON.stringify(next),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});return next;}catch{const latest=await readShoppingAccount(uid,"test");if(latest.lastAction===actionId)return latest;throw Error("Account changed or storage unavailable. Refresh before retrying.");}
}
/** Future trusted payment/provider worker must supply an authenticated owner ID and
 * validated state. No public route calls this; no browser may write live records. */
export async function appendVerifiedLiveSnapshot(uid:string,expectedRevision:number,next:AccountState){
 const old=await snapshot(uid,"live");if(old.revision!==expectedRevision||next.version!==1||next.mode!=="live"||next.revision!==expectedRevision+1)throw Error("Live account revision mismatch.");
 await put(root(uid,"live")+filename(next.revision),JSON.stringify(next),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});
}
