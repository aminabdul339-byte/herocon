import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {authApi,customerAuthConfigured,setCustomerCookies,verifyCustomerAccess} from "@/lib/customer-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const url=new URL(request.url);
 const token=url.searchParams.get("token_hash")||"";
 const type=url.searchParams.get("type")||"";
 if(!customerAuthConfigured()||!["signup","recovery","email","magiclink"].includes(type)||!token||token.length>1024){
  return NextResponse.redirect("https://herocon.store/account?error=confirmation",303);
 }
 try{
  const session=await authApi("/verify",{token_hash:token,type});
  if(!session.access_token||!session.refresh_token)throw Error("Missing identity session.");
  const u=await verifyCustomerAccess(session.access_token);
  const trialRequested=!!u&&(await cookies()).get("__Host-hc-trial-signup")?.value===u.email;
  if(!u)throw Error("Unverified identity.");
  const redirectTo=type==="recovery"?"https://herocon.store/account/new-password":"https://herocon.store/account?confirmed=1";
  const response=NextResponse.redirect(redirectTo,303);
  response.headers.set("Cache-Control","private, no-store");
  setCustomerCookies(response,session);
  if(trialRequested&&type!=="recovery")response.cookies.set("__Host-hc-trial-signup","",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});
  return response;
 }catch{
  return NextResponse.redirect("https://herocon.store/account?error=confirmation",303);
 }
}
