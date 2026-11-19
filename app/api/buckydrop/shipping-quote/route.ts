import {NextResponse} from "next/server";
import {callBucky,liveReady} from "@/lib/buckydrop-gateway";
import {BuckydropError} from "@/lib/buckydrop";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";

export const dynamic="force-dynamic";
export const runtime="nodejs";
type Rate={serviceCode:string;name:string;provider:string|null;amount:number|null;currency:"CNY"|null;approxGBP:number|null;estimatedDays:string|null;billedKg:number|null;actualKg:number|null;available:boolean|null;reason:string|null;risks:number[];notices:string[];taxNote:string|null};
const visitors=new Map<string,{start:number;count:number}>();
const COUNTRY=new Set(["GB","US","DE","FR","CA","AU","IE","NL","ES","IT","BE","SE","NO","DK","CH","NZ"]);
const KIND=new Map([["clothing","Clothing"],["general","General merchandise"],["cosmetics","Cosmetics or electronics"],["battery","Battery products"]]);
const error=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
const number=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0?v:null;
const string=(v:unknown,max=180)=>typeof v==="string"?v.replace(/[\x00-\x1f\x7f]/g," ").trim().slice(0,max):"";
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
function limited(request:Request){
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const now=Date.now();
 if(visitors.size>2000)for(const [k,v] of visitors)if(now-v.start>60000)visitors.delete(k);
 const record=visitors.get(ip);
 if(!record||now-record.start>60000){visitors.set(ip,{start:now,count:1});return false;}
 record.count++;return record.count>5;
}
export async function POST(request:Request){
 if(!liveReady())return error("Live BuckyDrop shipping quotations are not configured.",503);
 const origin=request.headers.get("origin");
 try{if(!origin||new URL(origin).origin!==new URL(request.url).origin)return error("Please request quotes from Herocon.",403);}catch{return error("Invalid origin.",403);}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return error("Expected a JSON request.",415);
 if(Number(request.headers.get("content-length")||0)>2500)return error("Request too large.",413);
 if(limited(request))return error("Too many quote requests. Please try again shortly.",429);
 let obj:Record<string,unknown>;
 try{const text=await request.text();if(text.length>2500)return error("Request too large.",413);obj=object(JSON.parse(text));}
 catch{return error("Invalid parcel details.",400);}
 const country=string(obj.country,2).toUpperCase();
 const kind=string(obj.kind,20);
 const gram=obj.grams,cm=[obj.length,obj.width,obj.height];
 const postCode=obj.postCode==null?"":string(obj.postCode,10);
 const validGram=typeof gram==="number"&&Number.isFinite(gram)&&gram>=1&&gram<=60000&&Math.round(gram)===gram;
 const validCm=cm.every(v=>typeof v==="number"&&Number.isFinite(v)&&v>0&&v<=200&&Math.round(v*100)===v*100);
 if(!COUNTRY.has(country)||!KIND.has(kind)||!validGram||!validCm||obj.postCode!=null&&postCode.length>10)return error("Please enter a valid destination, parcel type, weight and dimensions.",400);
 // BuckyDrop expects kilograms, not grams; length/width/height are centimetres.
 const [length,width,height]=cm as number[];
 const item:Record<string,unknown>={
  countryCode:country,lang:"en",orderBy:"price",orderType:"asc",
  productList:[{weight:Math.round((gram as number))/1000,length,width,height,count:1,productNameEn:KIND.get(kind)}]
 };
 if(postCode)item.postCode=postCode;
 const body={current:1,size:60,item};
 try{
  const data=await callBucky<{records?:unknown[];total?:number}>("shipping-quote",body);
  const records=Array.isArray(data.records)?data.records.slice(0,60):[];
  // The v1.2.6 quote response does not explicitly declare a payment currency.
  // CNY is a temporary merchant-selected display assumption, not a currency confirmed by the API.
  // Approximate GBP conversions are reference estimates, never binding checkout prices.
  const currency: "CNY"|null=process.env.BUCKYDROP_QUOTE_CURRENCY==="CNY"?"CNY":null;
  let rate:number|null=null,fxDate:string|null=null;
  if(currency==="CNY")try{const fx=await getReferenceCnyGbpRate();rate=fx.rate;fxDate=fx.date;}catch{}
  const rates:Rate[]=records.map(raw=>{
   const v=object(raw);
   const amount=number(v.totalPrice)??number(v.price);
   const risks=Array.isArray(v.riskList)?v.riskList.filter((x):x is number=>x===1||x===2):[];
   const notices=Array.isArray(v.serviceNoticeList)?v.serviceNoticeList.map(x=>{const n=object(x);return [string(n.title),string(n.content,220)].filter(Boolean).join(": ");}).filter(Boolean).slice(0,4):[];
   const from=number(v.minTimeInTransit),until=number(v.maxTimeInTransit);
   const estimatedDays=from!=null&&until!=null?from+"–"+until+" days":from!=null?"From "+from+" days":until!=null?"Up to "+until+" days":null;
   return {
    serviceCode:string(v.serviceCode,70),name:string(v.serviceName,100)||"Shipping route",
    provider:string(v.providerName,80)||null,amount,currency,
    approxGBP:amount!=null&&rate!=null?Math.round(amount*rate*100)/100:null,
    estimatedDays,billedKg:number(v.calculateWeight),actualKg:number(v.parcelTotalWeight),
    available:typeof v.available==="boolean"?v.available:null,reason:string(v.unavailableReason,230)||null,
    risks,notices,taxNote:string(v.isTariffCoverDesc,230)||null
   };
  }).filter(r=>r.serviceCode);
  return NextResponse.json({source:"BuckyDrop live OpenAPI",rates,returned:rates.length,total:typeof data.total==="number"?data.total:null,currency,fxDate,quotedAt:new Date().toISOString(),currencyWarning:currency==="CNY"?"Shipping prices are provisionally shown in CNY (¥) at the merchant’s request. BuckyDrop has not confirmed the currency of this specific API field. GBP conversions are indicative estimates only, not payable checkout quotes.":"The API does not specify a quote currency. Confirm it with your BuckyDrop account manager before treating the amounts as payable prices.",paymentAvailable:false},{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){
  if(e instanceof BuckydropError)return error(e.message,e.status);
  return error("Live shipping quotes are temporarily unavailable.",502);
 }
}
