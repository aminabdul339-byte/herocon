import {NextResponse} from "next/server";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {BuckydropError} from "@/lib/buckydrop";
import {getCachedBuckydropProduct} from "@/lib/buckydrop-cache";

export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 if(process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP!=="true"||(process.env.VERCEL_ENV==="production"&&process.env.BUCKYDROP_ENV!=="live")){
  return NextResponse.json({error:"BuckyDrop product data is not enabled."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
 const {id}=await params;
 if(!/^[A-Za-z0-9_-]{8,100}$/.test(id))return NextResponse.json({error:"Invalid product identifier."},{status:400});
 const catalogue=await getProducts();
 const product=catalogue.find(p=>productId(p)===id);
 if(!product?.originalMarketplaceUrl)return NextResponse.json({error:"No original marketplace URL recorded."},{status:404});
 try{
  const data=await getCachedBuckydropProduct(product.originalMarketplaceUrl);
  return NextResponse.json({product:data},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof BuckydropError)return NextResponse.json({error:error.message,code:error.code},{status:error.status,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({error:"Product detail service unavailable."},{status:502});
 }
}