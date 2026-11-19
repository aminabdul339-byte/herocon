import "server-only";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export const AUTH_ACCESS_COOKIE="__Host-hc-access";
export const AUTH_REFRESH_COOKIE="__Host-hc-refresh";
export type Customer={id:string;email:string;accessToken:string};
export type SupabaseSession={access_token?:string;refresh_token?:string;expires_in?:number;user?:{id?:string;email?:string;email_confirmed_at?:string|null}};
export class CustomerAuthError extends Error{
 constructor(public status:number,message:string){super(message);}
}
export function customerAuthConfigured():boolean{
 const url=process.env.HEROCON_SUPABASE_URL||"";
 const key=process.env.HEROCON_SUPABASE_PUBLISHABLE_KEY||"";
 try{
  const u=new URL(url);
  return u.protocol==="https:"&&!!u.hostname&&key.length>=24;
 }catch{return false;}
}
function config(){
 if(!customerAuthConfigured())throw new CustomerAuthError(503,"Customer registration is not connected yet. Herocon has not enabled account sign-ups.");
 return {url:new URL(process.env.HEROCON_SUPABASE_URL!).origin,key:process.env.HEROCON_SUPABASE_PUBLISHABLE_KEY!};
}
export async function authApi(path:string,body:unknown,method:"POST"|"PUT"="POST",token?:string){
 const {url,key}=config();
 const response=await fetch(url+"/auth/v1"+path,{
  method,headers:{apikey:key,"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},
  body:JSON.stringify(body),redirect:"error",cache:"no-store",signal:AbortSignal.timeout(12000)
 });
 const json=await response.json().catch(()=>({})) as Record<string,unknown>;
 if(!response.ok){
  const reason=typeof json.msg==="string"?json.msg:typeof json.error_description==="string"?json.error_description:
   typeof json.message==="string"?json.message:"Account request was not accepted.";
  throw new CustomerAuthError(response.status>=500?503:response.status,reason.slice(0,160));
 }
 return json as SupabaseSession&Record<string,unknown>;
}
export async function verifyCustomerAccess(accessToken:string):Promise<Customer|null>{
 if(!customerAuthConfigured()||!accessToken||accessToken.length>10000)return null;
 try{
  const {url,key}=config();
  const response=await fetch(url+"/auth/v1/user",{
   headers:{apikey:key,Authorization:"Bearer "+accessToken},
   cache:"no-store",redirect:"error",signal:AbortSignal.timeout(10000)
  });
  if(!response.ok)return null;
  const user=await response.json() as {id?:unknown;email?:unknown;email_confirmed_at?:unknown};
  if(typeof user.id!=="string"||!/^[a-f0-9-]{36}$/i.test(user.id)||
   typeof user.email!=="string"||!user.email_confirmed_at)return null;
  return {id:user.id,email:user.email.toLowerCase(),accessToken};
 }catch{return null;}
}
export async function currentCustomer():Promise<Customer|null>{
 const cookieStore=await cookies();
 const access=cookieStore.get(AUTH_ACCESS_COOKIE)?.value;
 return access?verifyCustomerAccess(access):null;
}
const cookieOptions={httpOnly:true,secure:true,sameSite:"lax" as const,path:"/"};
export function setCustomerCookies(response:NextResponse,session:SupabaseSession){
 if(!session.access_token||!session.refresh_token||
  session.access_token.length>10000||session.refresh_token.length>10000)
  throw new CustomerAuthError(503,"Identity provider did not return a usable session.");
 response.cookies.set(AUTH_ACCESS_COOKIE,session.access_token,{
  ...cookieOptions,maxAge:Math.max(60,Math.min(3600,Number(session.expires_in)||3600))
 });
 response.cookies.set(AUTH_REFRESH_COOKIE,session.refresh_token,{
  ...cookieOptions,maxAge:60*60*24*30
 });
}
export function clearCustomerCookies(response:NextResponse){
 response.cookies.set(AUTH_ACCESS_COOKIE,"",{...cookieOptions,maxAge:0});
 response.cookies.set(AUTH_REFRESH_COOKIE,"",{...cookieOptions,maxAge:0});
}
export function accountOriginValid(request:Request){
 const origin=request.headers.get("origin");
 try{
  return !!origin&&new URL(origin).origin===new URL(request.url).origin;
 }catch{return false;}
}
