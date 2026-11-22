import {NextResponse} from "next/server";
import {authorizedCheckoutAdmin} from "@/lib/approved-checkout";
import {merchantRequests,merchantUpdateRequest,QuoteRequestError} from "@/lib/quote-requests";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
const authenticated=(r:Request)=>authorizedCheckoutAdmin(r.headers.get("x-herocon-checkout-admin"));

export async function GET(request:Request){
 if(!authenticated(request))return reply({error:"Unauthorized."},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN)return reply({error:"Private storage is not configured."},503);
 try{
  const requests=await merchantRequests(40);
  return reply({requests});
 }catch{return reply({error:"Unable to load quote requests."},503);}
}
export async function POST(request:Request){
 if(!authenticated(request))return reply({error:"Unauthorized."},401);
 try{
  const origin=request.headers.get("origin");
  if(!origin||new URL(origin).origin!==new URL(request.url).origin)return reply({error:"Invalid request origin."},403);
 }catch{return reply({error:"Invalid request origin."},403);}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))
  return reply({error:"JSON required."},415);
 let input:Record<string,unknown>;
 try{
  const raw=await request.text();
  if(raw.length>3000)return reply({error:"Request too large."},413);
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=="object"||Array.isArray(value))return reply({error:"Invalid body."},400);
  input=value as Record<string,unknown>;
 }catch{return reply({error:"Invalid JSON."},400);}
 try{
  const updated=await merchantUpdateRequest(
   typeof input.userId==="string"?input.userId:"",
   typeof input.id==="string"?input.id:"",
   typeof input.status==="string"?input.status:"",
   input.note
  );
  return reply({request:updated});
 }catch(error){
  return reply({error:error instanceof QuoteRequestError?error.message:"Review could not be updated."},
   error instanceof QuoteRequestError?error.status:503);
 }
}
