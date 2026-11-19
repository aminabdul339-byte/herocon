import "server-only";
import {createHash} from "node:crypto";
import {get,list,put} from "@vercel/blob";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {notifyNewQuoteRequest} from "@/lib/quote-notifications";

const PREFIX="checkout/quote-requests/v1/by-user/";
const UUID=/^[a-f0-9-]{36}$/i;
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type QuoteRequestLine={title:string;marketplaceUrl:string;skuCode:string|null;variant:string|null;quantity:number};
export type QuoteRequest={
 version:1;id:string;userId:string;customerEmail:string;createdAt:string;
 status:"received";deliveryCountry:"GB";postcode:string;notes:string;
 lines:QuoteRequestLine[];paymentStatus:"no_payment_requested";
};
export type QuoteRequestView=QuoteRequest&{reviewState:"received"|"reviewing"|"needs_details"|"closed";reviewNote:string;reviewedAt:string|null};
export class QuoteRequestError extends Error{
 constructor(public status:number,message:string){super(message);}
}
const str=(v:unknown,max=180)=>typeof v==="string"?v.trim().replace(/[\x00-\x1f\x7f]/g," ").slice(0,max):"";
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const pathFor=(userId:string,id:string)=>PREFIX+userId+"/"+id+".json";
const validId=(v:string)=>/^qr_[a-f0-9]{32}$/.test(v);
function validLine(raw:unknown):QuoteRequestLine{
 const o=object(raw),marketplaceUrl=normalizeMarketplaceLink(o.marketplaceUrl);
 const title=str(o.title,120);
 const skuCode=str(o.skuCode,80);
 const variant=str(o.variant,100);
 const quantity=o.quantity;
 if(!marketplaceUrl||!title||typeof quantity!=="number"||
  !Number.isInteger(quantity)||quantity<1||quantity>99)
  throw new QuoteRequestError(400,"Each requested item needs a product name, supported seller link and quantity 1–99.");
 return {title,marketplaceUrl,skuCode:skuCode||null,variant:variant||null,quantity};
}
async function read(path:string):Promise<QuoteRequest|null>{
 try{
  const result=await get(path,{access:"private"});
  if(!result||result.statusCode!==200||!result.stream)return null;
  const raw=await new Response(result.stream).text();
  if(raw.length>12000)return null;
  const x=JSON.parse(raw) as QuoteRequest;
  if(x.version!==1||!UUID.test(x.userId)||!validId(x.id)||x.paymentStatus!=="no_payment_requested"||!Array.isArray(x.lines))return null;
  return x;
 }catch{return null;}
}
async function listPaths(prefix:string,limit:number){
 if(!process.env.BLOB_READ_WRITE_TOKEN)return [];
 const found:string[]=[];
 let cursor:string|undefined;
 for(let page=0;page<3&&found.length<limit;page++){
  const data=await list({prefix,limit:Math.min(100,limit-found.length),...(cursor?{cursor}:{})});
  for(const blob of data.blobs){
   if(blob.pathname.startsWith(prefix)&&blob.pathname.endsWith(".json"))found.push(blob.pathname);
  }
  if(!data.hasMore||!data.cursor)break;
  cursor=data.cursor;
 }
 return found.slice(0,limit);
}
async function withStatus(request:QuoteRequest):Promise<QuoteRequestView>{
 const root="checkout/quote-requests/v1/status/";
 let update:{requestId?:string;userId?:string;status?:string;note?:string;updatedAt?:string}|null=null;
 try{
  const found=await get(root+request.userId+"/"+request.id+".json",{access:"private"});
  if(found?.statusCode===200&&found.stream){
   const raw=await new Response(found.stream).text();
   if(raw.length<1500)update=JSON.parse(raw) as typeof update;
  }
 }catch{}
 const valid=update?.requestId===request.id&&update?.userId===request.userId&&
  (update.status==="reviewing"||update.status==="needs_details"||update.status==="closed");
 return {...request,reviewState:valid?update!.status as QuoteRequestView["reviewState"]:"received",
  reviewNote:valid&&typeof update!.note==="string"?update!.note.slice(0,450):"",
  reviewedAt:valid&&typeof update!.updatedAt==="string"?update!.updatedAt:null};
}
export async function merchantUpdateRequest(userId:string,id:string,status:string,note:unknown):Promise<QuoteRequestView>{
 if(!UUID.test(userId)||!validId(id)||!["reviewing","needs_details","closed"].includes(status))
  throw new QuoteRequestError(400,"Invalid request or status.");
 const request=await read(pathFor(userId,id));
 if(!request||request.userId!==userId)throw new QuoteRequestError(404,"Quote request not found.");
 const reviewNote=str(note,450);
 const update={version:1,requestId:id,userId,status,note:reviewNote,updatedAt:new Date().toISOString()};
 await put("checkout/quote-requests/v1/status/"+userId+"/"+id+".json",JSON.stringify(update),{
  access:"private",allowOverwrite:true,addRandomSuffix:false,contentType:"application/json"
 });
 return withStatus(request);
}
export async function customerRequests(userId:string,limit=40):Promise<QuoteRequestView[]>{
 if(!UUID.test(userId))return [];
 const paths=await listPaths(PREFIX+userId+"/",Math.min(limit,80));
 const rows=(await Promise.all(paths.map(read))).filter((x):x is QuoteRequest=>Boolean(x&&x.userId===userId));
 return Promise.all(rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,limit).map(withStatus));
}
export async function merchantRequests(limit=40):Promise<QuoteRequestView[]>{
 const paths=await listPaths(PREFIX,Math.min(Math.max(limit,1)*3,300));
 const rows=(await Promise.all(paths.map(read))).filter((x):x is QuoteRequest=>Boolean(x));
 return Promise.all(rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,limit).map(withStatus));
}
export async function createCustomerRequest(input:unknown,user:{id:string;email:string}):Promise<QuoteRequest>{
 if(!UUID.test(user.id)||!EMAIL.test(user.email)||!process.env.BLOB_READ_WRITE_TOKEN)
  throw new QuoteRequestError(503,"Your quote request cannot be stored securely right now.");
 const obj=object(input);
 if(obj.deliveryCountry!=="GB")throw new QuoteRequestError(400,"We can currently review UK destination quotes only.");
 const postcode=str(obj.postcode,12).toUpperCase();
 if(!/^[A-Z0-9 ]{5,9}$/.test(postcode))throw new QuoteRequestError(400,"Please enter a valid UK destination postcode.");
 const notes=str(obj.notes,420);
 if(!Array.isArray(obj.lines)||obj.lines.length<1||obj.lines.length>5)
  throw new QuoteRequestError(400,"Select between one and five supplier items.");
 const lines=obj.lines.map(validLine);
 const keys=lines.map(l=>l.marketplaceUrl+"|"+(l.skuCode||"")+"|"+(l.variant||""));
 if(new Set(keys).size!==keys.length)throw new QuoteRequestError(400,"Combine duplicate product options before requesting a quote.");
 // Up to three stored requests per customer per 24 hours, independently of server instance.
 const existing=await customerRequests(user.id,50);
 const recent=existing.filter(x=>Date.parse(x.createdAt)>Date.now()-24*60*60*1000);
 const fingerprint=createHash("sha256").update(JSON.stringify({postcode,notes,lines})).digest("hex");
 const id="qr_"+createHash("sha256").update(user.id+"|"+fingerprint+"|"+new Date().toISOString().slice(0,10)).digest("hex").slice(0,32);
 const duplicate=recent.find(x=>x.id===id);
 if(duplicate)return duplicate;
 if(recent.length>=3)throw new QuoteRequestError(429,"You have reached three quote requests in 24 hours. Please check your existing requests.");
 const request:QuoteRequest={version:1,id,userId:user.id,customerEmail:user.email.toLowerCase(),
  createdAt:new Date().toISOString(),status:"received",deliveryCountry:"GB",postcode,notes,lines,
  paymentStatus:"no_payment_requested"};
 try{
  await put(pathFor(user.id,id),JSON.stringify(request),{
   access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"
  });
 }catch{
  const previously=await read(pathFor(user.id,id));
  if(previously)return previously;
  throw new QuoteRequestError(503,"Could not save the quote request. No payment has been taken.");
 }
 // Email is best-effort; the immutable private request remains available to the merchant even if email is unavailable.
 await notifyNewQuoteRequest(request).catch(()=>({merchant:false,customer:false}));
 return request;
}
