import "server-only";
import {createHash,randomBytes,timingSafeEqual} from "node:crypto";
import {get,put} from "@vercel/blob";

const PREFIX="orders/paid/v1/";
const ACCESS="private" as const;
export type PaidOrderRecord={
 version:1;
 partnerOrderNo:string;
 paymentReferenceHash:string;
 customerAccessHash:string;
 requestedAt:string;
 updatedAt:string;
 state:"sending"|"accepted"|"rejected"|"outcome_unknown";
 shopOrderNo:string|null;
 paymentStage?:"products"|"all_in";
 // Retained privately for same-order reconciliation. Never return this object to a browser.
 originalRequest:Record<string,unknown>;
};
const hash=(text:string)=>createHash("sha256").update(text).digest("hex");
const path=(ref:string)=>PREFIX+ref+".json";
export const partnerRefFromPayment=(id:string)=>"HC-"+hash(id).slice(0,25);
export const issueAccessCode=()=>randomBytes(24).toString("base64url");
export const codeHash=hash;
export function accessMatches(record:PaidOrderRecord,code:string){
 if(!code||code.length>200)return false;
 const actual=Buffer.from(hash(code),"hex"),expected=Buffer.from(record.customerAccessHash,"hex");
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function storageAvailable(){return Boolean(process.env.BLOB_READ_WRITE_TOKEN);}
export async function reservePaidOrder(record:PaidOrderRecord){
 if(!storageAvailable())throw Error("Private order storage is unavailable.");
 // Single-claim write: a duplicate payment notification cannot make a second order.
 await put(path(record.partnerOrderNo),JSON.stringify(record),{
  access:ACCESS,addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"
 });
}
export async function updatePaidOrder(record:PaidOrderRecord){
 if(!storageAvailable())throw Error("Private order storage is unavailable.");
 await put(path(record.partnerOrderNo),JSON.stringify(record),{
  access:ACCESS,addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"
 });
}
export async function findPaidOrder(ref:string):Promise<PaidOrderRecord|null>{
 if(!/^HC-[a-f0-9]{25}$/.test(ref)||!storageAvailable())return null;
 try{
  const blob=await get(path(ref),{access:ACCESS});
  if(!blob||blob.statusCode!==200||!blob.stream)return null;
  const body=await new Response(blob.stream).text();
  if(body.length>25000)return null;
  const obj:unknown=JSON.parse(body);
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return null;
  const rec=obj as PaidOrderRecord;
  if(rec.version!==1||rec.partnerOrderNo!==ref||!["sending","accepted","rejected","outcome_unknown"].includes(rec.state))return null;
  return rec;
 }catch{return null;}
}
