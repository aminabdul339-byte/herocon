import {NextResponse} from "next/server";
import {accountOriginValid,clearCustomerCookies} from "@/lib/customer-auth";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!accountOriginValid(request))return NextResponse.json({error:"Invalid request origin"},{status:403});
 const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 clearCustomerCookies(response);
 return response;
}
