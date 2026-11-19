import {NextResponse} from "next/server";
import {accountOriginValid,authApi,currentCustomer,CustomerAuthError} from "@/lib/customer-auth";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!accountOriginValid(request))return NextResponse.json({error:"Invalid origin"},{status:403});
 const user=await currentCustomer();
 if(!user)return NextResponse.json({error:"Please open your signed password-reset link first."},{status:401});
 try{
  const raw=await request.text();
  if(raw.length>400)return NextResponse.json({error:"Invalid password request."},{status:400});
  const d=JSON.parse(raw) as {password?:unknown};
  if(typeof d.password!=="string"||d.password.length<12||d.password.length>128)
   return NextResponse.json({error:"Use a password between 12 and 128 characters."},{status:400});
  await authApi("/user",{password:d.password},"PUT",user.accessToken);
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  return NextResponse.json({error:e instanceof CustomerAuthError?e.message:"Password update was unavailable."},
   {status:e instanceof CustomerAuthError?e.status:503});
 }
}
