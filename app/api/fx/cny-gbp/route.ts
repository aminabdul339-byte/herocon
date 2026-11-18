import {NextResponse} from "next/server";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";

export const dynamic="force-dynamic";
export async function GET(){
 try{
  const fx=await getReferenceCnyGbpRate();
  return NextResponse.json({base:"CNY",quote:"GBP",...fx,source:"Frankfurter reference rates"},{headers:{"Cache-Control":"public, s-maxage=1800, stale-while-revalidate=3600"}});
 }catch{
  return NextResponse.json({error:"GBP reference conversion unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}