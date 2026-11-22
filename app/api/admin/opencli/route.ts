import {NextResponse} from "next/server";
import {timingSafeEqual,createHash} from "node:crypto";
import {list} from "@vercel/blob";
import {getProducts} from "@/lib/catalogue-server";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {marketplaceIdentity} from "@/lib/catalogue-identity";
import {OPENCLI_SNAPSHOT_PREFIX,saveOpenCliSnapshot,OpenCliSnapshotError} from "@/lib/opencli-snapshots";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers});
const hash=(link:string)=>createHash("sha256").update(link).digest("hex");
function authorized(request:Request):boolean{
 const expected=process.env.HEROCON_CATALOGUE_IMPORT_KEY||"";
 const supplied=request.headers.get("x-herocon-catalogue-admin")||"";
 return expected.length>=48&&expected.length===supplied.length&&
  timingSafeEqual(Buffer.from(expected),Buffer.from(supplied));
}
async function savedHashes():Promise<ReadonlySet<string>>{
 const set=new Set<string>();
 let cursor:string|undefined;
 // Iterate until exhausted so large catalogues do not re-fetch already saved links.
 do{
  const page=await list({prefix:OPENCLI_SNAPSHOT_PREFIX,limit:1000,...(cursor?{cursor}:{})});
  for(const item of page.blobs){
   const matched=item.pathname.match(/\/([a-f0-9]{64})\.json$/);
   if(matched)set.add(matched[1]);
  }
  cursor=page.hasMore?page.cursor:undefined;
 }while(cursor);
 return set;
}
export async function GET(request:Request){
 if(!authorized(request))return json({error:"Unauthorized."},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN)return json({error:"Private storage is unavailable."},503);
 const url=new URL(request.url);
 const requested=Number(url.searchParams.get("limit")||"20");
 const limit=Number.isInteger(requested)?Math.min(20,Math.max(1,requested)):20;
 const marketplace=url.searchParams.get("marketplace")||"all";
 if(!["all","1688","Taobao"].includes(marketplace))return json({error:"Invalid marketplace."},400);
 try{
  const [products,saved]=await Promise.all([getProducts(),savedHashes()]);
  const queue:{url:string;marketplace:"1688"|"Taobao";id:string;title:string;imageUrl:string|null}[]=[];
  const seen=new Set<string>();let eligible=0,alreadySaved=0,unsupported=0;
  for(const product of products){
   const source=normalizeMarketplaceLink(product.originalMarketplaceUrl);
   const identity=marketplaceIdentity(source);
   if(!source||!identity||!["1688","Taobao"].includes(identity.marketplace)){unsupported++;continue;}
   if(marketplace!=="all"&&identity.marketplace!==marketplace)continue;
   if(seen.has(source))continue;
   seen.add(source);
   eligible++;
   if(saved.has(hash(source))){alreadySaved++;continue;}
   if(queue.length<limit)queue.push({url:source,marketplace:identity.marketplace as "1688"|"Taobao",
     id:identity.productId,title:(product.title||"Product").slice(0,120),
     imageUrl:[product.imageUrl,...(product.images||[])].find(value=>typeof value==="string"&&value.startsWith("https://"))||null});
  }
  return json({queue,eligible,alreadySaved,remaining:eligible-alreadySaved,unsupported,
   mode:"read_only_queue",notice:"Queue retrieval does not access marketplaces or use BuckyDrop. Browser worker must run on your own logged-in Chrome."});
 }catch{return json({error:"Unable to load the OpenCLI collection queue."},503);}
}
export async function POST(request:Request){
 if(!authorized(request))return json({error:"Unauthorized."},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN)return json({error:"Private storage is unavailable."},503);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return json({error:"JSON required."},415);
 let payload:Record<string,unknown>;
 try{
  const raw=await request.text();
  if(raw.length>45000)return json({error:"Browser snapshot too large."},413);
  const obj:unknown=JSON.parse(raw);
  if(!obj||typeof obj!=="object"||Array.isArray(obj))return json({error:"Invalid request."},400);
  payload=obj as Record<string,unknown>;
 }catch{return json({error:"Invalid JSON."},400);}
 const source=normalizeMarketplaceLink(payload.sourceUrl);
 if(!source)return json({error:"Unsupported marketplace URL."},400);
 // Import only known catalogue links: this operator endpoint cannot create
 // arbitrary public listings or change purchasing and checkout states.
 try{
  const products=await getProducts();
  const known=products.some(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl)===source);
  if(!known)return json({error:"Link is not present in the Herocon catalogue."},404);
  const result=await saveOpenCliSnapshot(source,payload.record);
  return json({result,sourceUrl:source,provider:"opencli-browser",
   notice:"Saved public page observations only. No supplier SKU, stock or payable price is verified."},result==="saved"?201:200);
 }catch(error){
  return json({error:error instanceof OpenCliSnapshotError?error.message:"Could not save the browser snapshot."},
   error instanceof OpenCliSnapshotError?error.status:503);
 }
}
