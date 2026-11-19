import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {AUTH_ACCESS_COOKIE,AUTH_REFRESH_COOKIE,authApi,clearCustomerCookies,customerAuthConfigured,setCustomerCookies,verifyCustomerAccess} from "@/lib/customer-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
export async function GET(){
 if(!customerAuthConfigured())return reply({status:"unavailable",authenticated:false,reason:"Free accounts will open once Herocon's authentication service is connected."},503);
 const store=await cookies();
 const access=store.get(AUTH_ACCESS_COOKIE)?.value;
 if(access){
  const current=await verifyCustomerAccess(access);
  if(current)return reply({status:"authenticated",authenticated:true,user:{id:current.id,email:current.email}});
 }
 const refresh=store.get(AUTH_REFRESH_COOKIE)?.value;
 if(!refresh)return reply({status:"guest",authenticated:false});
 try{
  const tokens=await authApi("/token?grant_type=refresh_token",{refresh_token:refresh});
  if(!tokens.access_token||!tokens.refresh_token)throw Error("No refreshed tokens.");
  const customer=await verifyCustomerAccess(tokens.access_token);
  if(!customer)throw Error("Unconfirmed identity.");
  const response=reply({status:"authenticated",authenticated:true,user:{id:customer.id,email:customer.email}});
  setCustomerCookies(response,tokens);
  return response;
 }catch{
  const response=reply({status:"guest",authenticated:false});
  clearCustomerCookies(response);
  return response;
 }
}
