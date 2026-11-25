// Pure state and pricing for the isolated pre-launch rehearsal, never production pricing.
export const items=[{id:"bag",title:"Everyday shoulder bag",variant:"Chocolate brown",seller:"1688 · Seller A",goods:2000,domestic:200,weight:650},{id:"knit",title:"Cotton knit top",variant:"Ivory / M",seller:"Taobao · Seller B",goods:1250,domestic:100,weight:280}] as const;
export const shippingLines=[{id:"economy",name:"Economy tracked",pence:1080},{id:"standard",name:"Standard tracked",pence:1560},{id:"express",name:"Express",pence:2540}] as const;
export const goodsPence=items.reduce((n,x)=>n+x.goods,0);
export const domesticPence=items.reduce((n,x)=>n+x.domestic,0);
export const procurementPence=Math.round(goodsPence*7/100);
export const productPence=goodsPence+domesticPence+procurementPence;
export type Stage="products"|"incoming"|"warehouse"|"packing"|"shipping"|"shipped"|"delivered";
export type EventName="product-paid"|"arrived"|"packing"|"packed"|"shipping-paid"|"delivered";
export type Event={name:EventName;at:string;line?:string;amountPence?:number;sessionId?:string};
export const sequence:EventName[]=["product-paid","arrived","packing","packed","shipping-paid","delivered"];
const stages:Stage[]=["products","incoming","warehouse","packing","shipping","shipped","delivered"];
export const stageFor=(events:readonly Event[]):Stage=>stages[events.length]||"delivered";
export const nextEvent=(events:readonly Event[]):EventName|undefined=>sequence[events.length];
export function shippingAmount(line:unknown){const found=shippingLines.find(x=>x.id===line);if(!found)throw Error("Invalid shipping line");return found.pence;}
export function verifyEvent(events:readonly Event[],event:Event){
 if(nextEvent(events)!==event.name)throw Error("Invalid order transition");
 if(event.name==="product-paid"&&event.amountPence!==productPence)throw Error("Product payment mismatch");
 if(event.name==="packing")shippingAmount(event.line);
 if(event.name==="shipping-paid"&&event.amountPence!==shippingAmount(events.find(x=>x.name==="packing")?.line))throw Error("Shipping payment mismatch");
 return [...events,event];
}
export function verifiedTestPayment(session:Record<string,any>,expected:{id:string;userId:string;stage:"product"|"shipping";amount:number}){
 return session.livemode===false&&typeof session.id==="string"&&session.id.startsWith("cs_test_")&&session.mode==="payment"&&session.payment_status==="paid"&&session.currency==="gbp"&&session.amount_total===expected.amount&&session.metadata?.purpose==="herocon_hio_rehearsal"&&session.metadata?.orderId===expected.id&&session.metadata?.userId===expected.userId&&session.metadata?.stage===expected.stage;
}
export const notices:Record<EventName,string>={"product-paid":"Test product payment confirmed. Simulated procurement orders submitted to two sellers.","arrived":"Simulated goods received and ready in My Warehouse.","packing":"Simulated consolidation and packing requested.","packed":"Simulated final freight available. Shipping payment required.","shipping-paid":"Test shipping payment confirmed. Simulated parcel dispatched.","delivered":"Simulated delivery completed."};
