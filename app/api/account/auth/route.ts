import {publicEmailError} from "@/lib/email-auth-error";
import {NextResponse} from "next/server";
import {accountOriginValid,authApi,customerAuthConfigured,CustomerAuthError,setCustomerCookies} from "@/lib/customer-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(obj:unknown,status=200)=>NextResponse.json(obj,{status,headers:{"Cache-Control":"private, no-store"}});
const visitors=new Map<string,{since:number,count:number}>();
function rateLimited(request:Request){
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const now=Date.now();
 if(visitors.size>3000)for(const [k,v] of visitors)if(now-v.since>900000)visitors.delete(k);
 const entry=visitors.get(ip);
 if(!entry||now-entry.since>900000){visitors.set(ip,{since:now,count:1});return false;}
 return ++entry.count>15;
}
export async function POST(request:Request){
 if(!accountOriginValid(request))return reply({error:"Please use the Herocon account page."},403);
 if(!customerAuthConfigured())return reply({error:"Free sign-up is awaiting a connected identity service. No account or membership payment has been created."},503);
 if(rateLimited(request))return reply({error:"Too many attempts. Please try again later."},429);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"Expected a JSON account request."},415);
 let data:Record<string,unknown>;
 try{
  const raw=await request.text();
  if(raw.length>1200)return reply({error:"Request too long."},413);
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Invalid");
  data=parsed as Record<string,unknown>;
 }catch{return reply({error:"Invalid account request."},400);}
 const mode=data.mode;
 if(!["signup","login","recover","verify","resend"].includes(String(mode)))return reply({error:"Unknown account action."},400);
 const email=typeof data.email==="string"?data.email.trim().toLowerCase():"";
 const password=typeof data.password==="string"?data.password:"";
 if(email.length<5||email.length>150||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({error:"Please enter a valid email address."},400);
 if((mode==="signup"||mode==="login")&&(password.length<12||password.length>128))return reply({error:"Use a password of at least 12 characters."},400);
 try{
  if(mode==="resend"){await authApi("/resend?redirect_to="+encodeURIComponent("https://herocon.store/account?confirmed=1"),{type:"signup",email});return reply({ok:true,message:"Verification email requested. Check your inbox and spam folder."});}
  if(mode==="verify"){const code=typeof data.code==="string"?data.code:"";if(!/^\d{6,10}$/.test(code))return reply({error:"Enter a valid verification code."},400);const session=await authApi("/verify",{email,token:code,type:"signup"});if(!session.access_token||!session.user?.email_confirmed_at)return reply({error:"Email verification failed."},403);const response=reply({ok:true,authenticated:true});setCustomerCookies(response,session);return response;}
  if(mode==="recover"){
   await authApi("/recover?redirect_to="+encodeURIComponent("https://herocon.store/account/new-password"),{email});
   return reply({ok:true,message:"If an account exists, password-reset instructions will be sent to that email address."});
  }
  if(mode==="signup"){
   const result=await authApi("/signup?redirect_to="+encodeURIComponent("https://herocon.store/account?confirmed=1"),{email,password});
   if(result.access_token)return reply({error:"Email confirmation must be enabled before registration."},503);
   return reply({ok:true,requiresConfirmation:true,message:"Check your inbox for a verification code or confirmation link."});
  }
  const session=await authApi("/token?grant_type=password",{email,password});
  if(!session.user?.email_confirmed_at)return reply({error:"Please confirm your email address before signing in."},403);
  if(!session.access_token||!session.refresh_token)return reply({error:"Unable to open a verified session."},503);
  const response=reply({ok:true,authenticated:true,accountEmail:email,freeAccount:true});
  setCustomerCookies(response,session);
  return response;
 }catch(error){
  if(mode!=="login"){const failure=publicEmailError(error,String(mode));return reply({error:failure.error},failure.status);}
  return reply({error:error instanceof CustomerAuthError?error.message:"The account service is temporarily unavailable."},
   error instanceof CustomerAuthError?error.status:503);
 }
}
