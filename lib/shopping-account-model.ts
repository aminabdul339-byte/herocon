/** Shared customer account model. All amounts in minor units; never client payment authority. */
export type Currency="GBP"|"CNY";
export type ItemStatus="purchased"|"incoming"|"warehouse"|"reserved"|"parcel"|"cancelled"|"returned";
export type ParcelStatus="packing"|"shipping_due"|"shipping_paid"|"shipped"|"delivered";
export type AccountItem={id:string;orderId:string;title:string;variant:string;quantity:number;unitMinor:number;currency:Currency;image?:string;productPath?:string;status:ItemStatus;weightG?:number;qcPhotos?:string[];parcelId?:string};
export type Purchase={id:string;createdAt:string;amountMinor:number;currency:Currency;itemIds:string[];feeMinor?:number;domesticMinor?:number};
export type Parcel={id:string;createdAt:string;itemIds:string[];status:ParcelStatus;shippingMinor?:number;currency:Currency;channel?:string;tracking?:string;carrier?:string;estimatedDays?:string};
export type AccountUpdate={id:string;at:string;reference:string;text:string};
export type RequestRecord={id:string;at:string;itemId:string;kind:"cancel"|"return";status:"requested"};
export type AccountState={version:1;revision:number;mode:"live"|"test";orders:Purchase[];items:AccountItem[];parcels:Parcel[];updates:AccountUpdate[];requests:RequestRecord[];lastAction?:string};
export const emptyAccount=(mode:AccountState["mode"]):AccountState=>({version:1,revision:0,mode,orders:[],items:[],parcels:[],updates:[],requests:[]});
export const itemLabels:Record<ItemStatus,string>={purchased:"Payment received",incoming:"On the way to warehouse",warehouse:"Ready to ship",reserved:"Preparing shipment",parcel:"In parcel",cancelled:"Cancelled",returned:"Returned"};
export const parcelLabels:Record<ParcelStatus,string>={packing:"Preparing parcel",shipping_due:"Shipping payment due",shipping_paid:"Awaiting dispatch",shipped:"In transit",delivered:"Delivered"};
export function counts(s:AccountState){return {orders:s.items.filter(x=>x.status==="purchased"||x.status==="incoming").reduce((n,x)=>n+x.quantity,0),warehouse:s.items.filter(x=>x.status==="warehouse"||x.status==="reserved").reduce((n,x)=>n+x.quantity,0),parcels:s.parcels.filter(x=>x.status==="shipping_paid"||x.status==="shipped").length};}
export type TestAction={type:"advance-item";id:string}|{type:"pack";ids:string[];id:string}|{type:"quote";id:string;amount:number;channel:string}|{type:"pay-shipping";id:string}|{type:"advance-parcel";id:string}|{type:"request";id:string;kind:"cancel"|"return"};
const positive=(v:unknown):v is number=>typeof v==="number"&&Number.isSafeInteger(v)&&v>0&&v<=100000000;
export function applyTestAction(previous:AccountState,action:TestAction,at:string,actionId:string):AccountState{
 if(previous.mode!=="test")throw Error("Simulation cannot modify live records.");
 const s:AccountState=JSON.parse(JSON.stringify(previous));let reference="",message="";
 const item=(id:string)=>{const i=s.items.find(x=>x.id===id);if(!i)throw Error("Item not found.");return i;};
 const parcel=(id:string)=>{const p=s.parcels.find(x=>x.id===id);if(!p)throw Error("Parcel not found.");return p;};
 switch(action.type){
 case "advance-item":{const i=item(action.id);reference=i.orderId;if(i.status==="purchased"){i.status="incoming";message=i.title+" purchased and on the way to the warehouse.";}else if(i.status==="incoming"){i.status="warehouse";message=i.title+" received at the warehouse.";}else throw Error("Item cannot advance.");break;}
 case "pack":{if(!Array.isArray(action.ids)||action.ids.length<1||action.ids.length>50||new Set(action.ids).size!==action.ids.length||s.parcels.some(p=>p.id===action.id))throw Error("Invalid parcel selection.");const picked=action.ids.map(item);if(picked.some(i=>i.status!=="warehouse"||i.parcelId||s.requests.some(r=>r.itemId===i.id)))throw Error("Only available warehouse items can be packed.");for(const i of picked){i.status="reserved";i.parcelId=action.id;}s.parcels.push({id:action.id,createdAt:at,itemIds:[...action.ids],status:"packing",currency:"CNY"});reference=action.id;message="Warehouse items reserved for one consolidated parcel.";break;}
 case "quote":{const p=parcel(action.id);if(p.status!=="packing"||!positive(action.amount)||typeof action.channel!=="string"||!action.channel.trim()||action.channel.length>120)throw Error("Invalid shipping quote.");p.shippingMinor=action.amount;p.channel=action.channel;p.status="shipping_due";reference=p.id;message="Final simulated shipping amount is ready.";break;}
 case "pay-shipping":{const p=parcel(action.id);if(p.status!=="shipping_due"||!positive(p.shippingMinor)||p.itemIds.some(id=>{const i=item(id);return i.status!=="reserved"||i.parcelId!==p.id;}))throw Error("Shipping payment is not due.");p.status="shipping_paid";for(const id of p.itemIds)item(id).status="parcel";reference=p.id;message="Simulated shipping payment confirmed. Parcel awaiting dispatch.";break;}
 case "advance-parcel":{const p=parcel(action.id);if(p.status==="shipping_paid"){p.status="shipped";p.tracking="TEST-"+p.id.slice(-12);message="Simulated parcel dispatched.";}else if(p.status==="shipped"){p.status="delivered";message="Simulated parcel delivered.";}else throw Error("Parcel cannot advance.");reference=p.id;break;}
 case "request":{const i=item(action.id);if(action.kind!=="cancel"&&action.kind!=="return")throw Error("Invalid request.");if(action.kind==="cancel"&&i.status!=="purchased"||action.kind==="return"&&i.status!=="warehouse"||s.requests.some(r=>r.itemId===i.id))throw Error("Request not available for this item.");s.requests.push({id:actionId,at,itemId:i.id,kind:action.kind,status:"requested"});reference=i.orderId;message=(action.kind==="cancel"?"Cancellation":"Return")+" request recorded for "+i.title+". No refund has been issued.";break;}
 default:throw Error("Unknown test action.");
 }
 s.revision++;s.lastAction=actionId;s.updates.unshift({id:actionId,at,reference,text:message});return s;
}
export function safeImage(value:unknown):string|undefined{if(typeof value!=="string"||value.length>2000)return;try{const u=new URL(value);if(u.protocol==="https:"&&!u.username&&!u.password)return u.href;}catch{}}
