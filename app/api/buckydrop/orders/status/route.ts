import {NextResponse} from "next/server";
import {callBucky,liveReady} from "@/lib/buckydrop-gateway";
import {findPaidOrder,accessMatches} from "@/lib/buckydrop-order-store";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const error=(msg:string,status:number)=>NextResponse.json({error:msg},{status,headers:{"Cache-Control":"no-store"}});
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const text=(v:unknown,n=200)=>typeof v==="string"?v.trim().slice(0,n):"";
const integer=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)?v:null;
const poLabels:Record<number,string>={0:"Unpaid",1:"Paid",2:"Reviewed",3:"Processing",4:"Awaiting confirmation",5:"Ordered from seller",6:"Shipped domestically",7:"Received",8:"Cancelled",9:"Warehouse inbound",10:"Preparing shipment",11:"Sent for international delivery",12:"Completed",13:"Receipt refused"};
const packageLabels:Record<number,string>={1:"Processing",2:"Preparing outbound",3:"Being packed",4:"Packed",5:"Verified",6:"Out of warehouse",7:"Awaiting receipt confirmation",8:"Returned domestically",9:"Returned internationally",10:"Cancelled",11:"Completed",100:"Other"};
const trackLabels:Record<number,string>={1:"In transit",2:"Out for delivery",3:"Delivered",4:"Delivery exception",5:"Held at customs",6:"Returning",7:"Return received",8:"Returned",9:"Tracking not available yet"};
const salesLabels:Record<number,string>={1:"Paid",2:"Cancelled",3:"Transaction complete"};
const attempts=new Map<string,{time:number;count:number}>();
function rateLimited(request:Request){
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const now=Date.now();
 if(attempts.size>1000)for(const [key,row] of attempts)if(now-row.time>60000)attempts.delete(key);
 const row=attempts.get(ip);
 if(!row||now-row.time>60000){attempts.set(ip,{time:now,count:1});return false;}
 row.count++;return row.count>5;
}
function trackingNodes(value:unknown){
 const o=object(value);
 return Array.isArray(o.traceNodes)?o.traceNodes.map(v=>{
  const row=object(v);
  return {description:text(row.description,260),location:text(row.pos,140)};
 }).filter(row=>row.description||row.location).slice(-20):[];
}
export async function POST(request:Request){
 if(!liveReady())return error("Tracking is not configured.",503);
 const origin=request.headers.get("origin");
 try{if(!origin||new URL(origin).origin!==new URL(request.url).origin)return error("Please check your order from Herocon.",403);}catch{return error("Invalid origin.",403);}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return error("Expected JSON.",415);
 if(rateLimited(request))return error("Too many tracking requests. Please try again later.",429);
 let body:Record<string,unknown>;
 try{const raw=await request.text();if(raw.length>1000)return error("Request too long.",413);body=object(JSON.parse(raw));}catch{return error("Invalid tracking request.",400);}
 const ref=text(body.partnerOrderNo,50),accessCode=text(body.accessCode,200);
 if(!/^HC-[a-f0-9]{25}$/.test(ref)||accessCode.length<24)return error("Order not found or access code incorrect.",404);
 const record=await findPaidOrder(ref);
 if(!record||!accessMatches(record,accessCode))return error("Order not found or access code incorrect.",404);
 const base={partnerOrderNo:record.partnerOrderNo,shopOrderNo:record.shopOrderNo,submittedAt:record.requestedAt,localState:record.state,shippingPrepaid:record.paymentStage==="all_in"};
 if(record.state==="sending")return NextResponse.json({...base,message:"Order submission is being reconciled.",salesStatus:null,purchaseOrders:[],parcels:[]},{headers:{"Cache-Control":"no-store"}});
 let order:Record<string,unknown>;
 try{order=await callBucky("order-detail",{partnerOrderNo:record.partnerOrderNo});}
 catch{
  return NextResponse.json({...base,message:"Your order reference is saved, but supplier updates are temporarily unavailable.",salesStatus:null,purchaseOrders:[],parcels:[]},{headers:{"Cache-Control":"private, no-store"}});
 }
 const so=object(order.soOrderInfo),code=integer(so.orderStatus);
 const purchaseOrders=Array.isArray(order.poOrderList)?order.poOrderList.slice(0,25).map(v=>{
  const po=object(v),status=integer(po.orderStatus);
  return {reference:text(po.orderCode,100)||null,status:status===null?"Not reported":poLabels[status]||"Status "+status,statusCode:status};
 }):[];
 const packageIds=Array.isArray(order.orderPackageList)?order.orderPackageList.map(v=>text(object(object(v).packageInfo).packageCode,100)).filter(Boolean).slice(0,5):[];
 const parcels=await Promise.all(packageIds.map(async packageCode=>{
  let parcelStatus:string|null=null,trackingStatus:string|null=null,events:{description:string;location:string}[]=[];
  let carrier:string|null=null,trackingNumber:string|null=null;
  try{
   const parcel=await callBucky("package-detail",{packageCode});
   const value=integer(parcel.packageStatus);
   parcelStatus=value!==null?packageLabels[value]||"Status "+value:null;
  }catch{}
  try{
   const tracking=await callBucky("logistics-tracking",{packageCode});
   const value=integer(tracking.traceStatus);
   trackingStatus=value!==null?trackLabels[value]||"Status "+value:null;
   carrier=text(tracking.serviceName,100)||null;
   trackingNumber=text(tracking.traceNo,120)||null;
   events=[...trackingNodes(tracking.originTraceInfo),...trackingNodes(tracking.destinationTraceInfo)].slice(-30);
  }catch{}
  return {packageCode,parcelStatus,trackingStatus,carrier,trackingNumber,events};
 }));
 // These statuses reflect only provider-reported events; they do not
 // confirm a final shipping invoice, paid freight or the availability of
 // quality-control images in the BuckyDrop API.
 const warehouseReceived=purchaseOrders.length>0&&purchaseOrders.every(po=>
  po.statusCode!==null&&[7,10,11,12].includes(po.statusCode));
 const warehouseInbound=purchaseOrders.some(po=>po.statusCode===9);
 const internationalDispatched=parcels.some(parcel=>
  ["Out of warehouse","Completed"].includes(parcel.parcelStatus||"")||
  ["In transit","Out for delivery","Delivered"].includes(parcel.trackingStatus||""));
 // A pre-generated tracking number does not establish that a parcel was dispatched.
 const fulfilmentStage=internationalDispatched?"international_dispatched":
  warehouseReceived?"warehouse_arrival_reported":
  warehouseInbound?"arriving_at_warehouse":
  purchaseOrders.length>0?"supplier_procurement":"awaiting_provider_update";
 const warehouse={
  stage:fulfilmentStage,
  arrivalReported:warehouseReceived,
  arrivalVerifiedForShipping:false,
  finalShippingQuote:"not_available" as const,
  shippingPaymentEnabled:false,
  note:warehouseReceived
   ?(record.paymentStage==="all_in"?"Warehouse arrival reported. Herocon has included shipping in the original payment.":"Warehouse arrival reported. International shipping will be quoted separately.")
   :(record.paymentStage==="all_in"?"Warehouse arrival not yet confirmed. No additional customer shipping payment is due.":"Warehouse arrival is not yet confirmed. International shipping cannot be charged yet.")
 };
 return NextResponse.json({...base,warehouse,salesStatus:code===null?null:salesLabels[code]||"Status "+code,
  purchaseOrders,parcels,message:record.state==="outcome_unknown"?"The order is undergoing verification; any supplier status shown is based on the original reference.":null},{
  headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}
 });
}
