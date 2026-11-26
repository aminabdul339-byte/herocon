import {NextResponse} from "next/server";
import {get,list,put,del} from "@vercel/blob";
import {createHash} from "node:crypto";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {cleanFind,type SavedFind} from "@/lib/sourcing-workspace-model";
export const runtime="nodejs";export const dynamic="force-dynamic";
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const prefix=(uid:string)=>"account/saved-finds/v1/"+hash(uid)+"/";
const path=(uid:string,url:string)=>prefix(uid)+hash(url)+".json";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
async function read(key:string):Promise<SavedFind|null>{const b=await get(key,{access:"private",useCache:false});if(!b||b.statusCode!==200||!b.stream)return null;return cleanFind(JSON.parse(await new Response(b.stream).text()));}
export async function GET(){
 const user=await currentCustomer();if(!user)return reply({error:"Sign in to view your saved products."},401);
 try{const rows=await list({prefix:prefix(user.id),limit:100});const items:SavedFind[]=[];
  for(let i=0;i<rows.blobs.length;i+=10){const batch=await Promise.all(rows.blobs.slice(i,i+10).map(b=>read(b.pathname)));for(const item of batch)if(item)items.push(item);}
  return reply({items});
 }catch{return reply({error:"Saved products are temporarily unavailable."},503);}
}
export async function POST(req:Request){
 if(!accountOriginValid(req))return reply({error:"Use the Herocon website."},403);
 const user=await currentCustomer();if(!user)return reply({error:"Sign in to save products."},401);
 if(!(req.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"Invalid request."},415);
 try{const raw=await req.text();if(raw.length>6000)return reply({error:"Request too long."},413);const data=JSON.parse(raw);
  const url=normalizeMarketplaceLink(data?.url);if(!url)return reply({error:"Invalid supplier link."},400);
  const key=path(user.id,url);
  if(data.action==="remove"){await del(key);return reply({ok:true});}
  const existing=await read(key);
  if(data.action==="folder"){if(!existing)return reply({error:"Product not found."},404);const item=cleanFind({...existing,folder:data.folder});if(!item)return reply({error:"Invalid collection."},400);await put(key,JSON.stringify(item),{access:"private",allowOverwrite:true,addRandomSuffix:false,contentType:"application/json"});return reply({ok:true,item});}
  if(data.action!=="save")return reply({error:"Invalid action."},400);
  const item=cleanFind({...data,folder:existing?.folder||"My finds"});if(!item)return reply({error:"Invalid product."},400);
  if(!existing&&(await list({prefix:prefix(user.id),limit:100})).blobs.length>=100)return reply({error:"You can save up to 100 products. Remove one to make space."},409);
  await put(key,JSON.stringify(item),{access:"private",allowOverwrite:true,addRandomSuffix:false,contentType:"application/json"});return reply({ok:true,item});
 }catch{return reply({error:"Could not update your saved products."},503);}
}
