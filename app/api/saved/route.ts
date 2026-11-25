import {NextRequest,NextResponse} from "next/server";
import {accessibleBusinessProducts as getProducts} from "@/lib/catalogue-access";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const raw=request.nextUrl.searchParams.get("ids")||"";
 const ids=[...new Set(raw.split(",").filter(v=>/^[a-zA-Z0-9_-]{8,100}$/.test(v)))].slice(0,100);
 if(!ids.length)return NextResponse.json({products:[]});
 const selected=new Set(ids),all=await getProducts();
 return NextResponse.json({products:all.filter(p=>p.doppelProductId&&selected.has(p.doppelProductId))},{headers:{"Cache-Control":"no-store"}});
}