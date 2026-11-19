import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {createCustomerRequest,customerRequests,QuoteRequestError} from "@/lib/quote-requests";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"}});
export async function GET(){
 const user=await currentCustomer();
 if(!user)return reply({error:"Sign in to view your quote requests."},401);
 try{
  const rows=await customerRequests(user.id,40);
  return reply({requests:rows,notice:"Requests are not paid orders. A merchant reviews prices and shipping separately."});
 }catch{return reply({error:"Quote requests could not be loaded."},503);}
}
export async function POST(request:Request){
 if(!accountOriginValid(request))return reply({error:"Request a quote through Herocon."},403);
 const user=await currentCustomer();
 if(!user)return reply({error:"Sign in to your free Herocon account first."},401);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))
  return reply({error:"A JSON quote request is required."},415);
 let input:unknown;
 try{
  const raw=await request.text();
  if(raw.length>4000)return reply({error:"Too many request details."},413);
  input=JSON.parse(raw);
 }catch{return reply({error:"Invalid quote request."},400);}
 try{
  const saved=await createCustomerRequest(input,user);
  return reply({id:saved.id,createdAt:saved.createdAt,status:saved.status,notice:"Quote request saved. This is not a paid order; Herocon will review the request before offering any price."},201);
 }catch(e){return reply({error:e instanceof QuoteRequestError?e.message:"Could not save this request."},e instanceof QuoteRequestError?e.status:503);}
}
