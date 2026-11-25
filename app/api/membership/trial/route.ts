import {publicEmailError} from "@/lib/email-auth-error";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";

import {accountOriginValid,authApi,currentCustomer,customerAuthConfigured,setCustomerCookies,verifyCustomerAccess,CustomerAuthError} from "@/lib/customer-auth";
import {readPremiumTrial,startPremiumTrial} from "@/lib/premium-trial";
import {trialActive} from "@/lib/premium-trial-model";
import {membershipEntitlement} from "@/lib/membership-access";
export const runtime="nodejs";export const dynamic="force-dynamic";
const COOKIE="__Host-hc-trial-signup";
const opts={httpOnly:true,secure:true,sameSite:"lax" as const,path:"/"};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
const emailValid=(email:string)=>email.length<=150&&email.length>=5&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const visits=new Map<string,{at:number;count:number}>();
function limited(req:Request){const ip=req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown",now=Date.now();if(visits.size>3000)for(const [k,v] of visits)if(now-v.at>900000)visits.delete(k);const v=visits.get(ip);if(!v||now-v.at>900000){visits.set(ip,{at:now,count:1});return false;}return ++v.count>12;}
export async function GET(){const u=await currentCustomer();if(!u)return reply({authenticated:false},401);try{const t=await readPremiumTrial(u);const membership=await membershipEntitlement(u);return reply({authenticated:true,trial:t,active:trialActive(t),premium:membership.premium,trialEndsAt:membership.trialEndsAt});}catch{return reply({error:"Trial service temporarily unavailable."},503);}}
export async function POST(req:Request){
 if(!accountOriginValid(req))return reply({error:"Open the Herocon trial page."},403);
 if(!customerAuthConfigured())return reply({error:"Email sign-in is unavailable."},503);
 if(limited(req))return reply({error:"Too many requests. Try again later."},429);
 let flow="trial";
 try{
  const raw=await req.text();if(raw.length>2000)return reply({error:"Request too long."},413);
  const d=JSON.parse(raw);if(!d||typeof d!=="object")return reply({error:"Invalid request."},400);
  flow=typeof d.action==="string"&&["signup","resend","verify","start"].includes(d.action)?d.action:"trial";
  if(d.action==="signup"||d.action==="resend"){
   const email=typeof d.email==="string"?d.email.trim().toLowerCase():"";
   if(!emailValid(email)||d.acceptedTerms!==true)return reply({error:"Enter your email and accept the terms."},400);
   if(d.action==="signup"){
    if(typeof d.password!=="string"||d.password.length<12||d.password.length>128)return reply({error:"Create a password of at least 12 characters."},400);
    const session=await authApi("/signup?redirect_to="+encodeURIComponent("https://herocon.store/account?confirmed=1"),{email,password:d.password});
    if(session.access_token)return reply({error:"Email confirmation must be enabled before trial registration."},503);
   }else{
    if((await cookies()).get(COOKIE)?.value!==email)return reply({error:"Create your account first, then request another code."},400);
    await authApi("/resend?redirect_to="+encodeURIComponent("https://herocon.store/account?confirmed=1"),{type:"signup",email});
   }
   const response=reply({ok:true});response.cookies.set(COOKIE,email,{...opts,maxAge:3600});return response;
  }
  if(d.action==="verify"){
   const email=typeof d.email==="string"?d.email.trim().toLowerCase():"";
   if(!emailValid(email)||typeof d.code!=="string"||!/^\d{6,10}$/.test(d.code)||d.acceptedTerms!==true)return reply({error:"Enter your email verification code and accept the terms."},400);
   if((await cookies()).get(COOKIE)?.value!==email)return reply({error:"Please sign up or request a new verification email in this browser."},400);
   const session=await authApi("/verify",{email,token:d.code,type:"signup"});
   const customer=session.access_token?await verifyCustomerAccess(session.access_token):null;
   if(!customer||customer.email!==email)return reply({error:"Email verification failed."},403);
   let active=false,trialError:string|undefined;
   try{const existing=await membershipEntitlement(customer);if(existing.premium)active=true;else active=trialActive(await startPremiumTrial(customer,customer.verifiedAt));}
   catch{trialError="Email verified. Trial activation could not be confirmed. Sign in and select Start trial to retry.";}
   const response=reply({ok:true,active,trialError});setCustomerCookies(response,session);response.cookies.set(COOKIE,"",{...opts,maxAge:0});return response;
  }
  if(d.action==="start"){
   if(d.acceptedTerms!==true)return reply({error:"Accept the trial terms first."},400);
   const u=await currentCustomer();if(!u)return reply({error:"Verify your email first."},401);
   const entitlement=await membershipEntitlement(u);
   if(entitlement.premium&&!entitlement.trialEndsAt)return reply({error:"You already have Premium access."},409);
   const trial=await startPremiumTrial(u);
   const confirmed=await readPremiumTrial(u);
   if(!confirmed||confirmed.endsAt!==trial.endsAt)return reply({error:"Trial activation could not be confirmed. Please retry."},503);
   return reply({trial:confirmed,active:trialActive(confirmed)});
  }
  return reply({error:"Unknown action."},400);
 }catch(e){const failure=publicEmailError(e,flow);return reply({error:failure.error},failure.status);}
}
