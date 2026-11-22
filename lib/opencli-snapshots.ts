import "server-only";
import {createHash} from "node:crypto";
import {get,put} from "@vercel/blob";
import type {Product} from "@/lib/types";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {marketplaceIdentity} from "@/lib/catalogue-identity";

const PREFIX="catalogue/opencli-snapshots/v1/";
const MAX_IMAGES=24;
export type OpenCliPriceTier={minQuantity:number;priceCNY:number};
export type OpenCliSnapshot={
 version:1;provider:"opencli-browser";originalMarketplaceUrl:string;
 marketplace:"1688"|"Taobao";sourceProductId:string;
 title:string;sellerName:string|null;images:string[];detailImages:string[];
 priceCNY:number|null;moq:number|null;priceTiers:OpenCliPriceTier[];
 sourceSpecs:{name:string;value:string}[];collectedAt:string;
};
export class OpenCliSnapshotError extends Error{
 constructor(public status:number,message:string){super(message);}
}
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const string=(v:unknown,max:number)=>typeof v==="string"?v.replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max):"";
const number=(v:unknown,maximum=1000000):number|null=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=maximum?v:null;
const image=(v:unknown):string|null=>{
 if(typeof v!=="string"||v.length>2048)return null;
 try{
  const url=new URL(v);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.hostname==="localhost")return null;
  return url.href;
 }catch{return null;}
};
function normalize(input:unknown,expectedUrl:string):OpenCliSnapshot{
 const source=normalizeMarketplaceLink(expectedUrl);
 const id=marketplaceIdentity(source);
 if(!id||!["1688","Taobao"].includes(id.marketplace))throw new OpenCliSnapshotError(400,"Only 1688 and Taobao links are currently supported by OpenCLI.");
 const raw=obj(input);
 if(raw.provider!==undefined&&raw.provider!=="opencli-browser")throw new OpenCliSnapshotError(400,"Invalid data provider.");
 if(raw.originalMarketplaceUrl!==undefined&&normalizeMarketplaceLink(raw.originalMarketplaceUrl)!==source)
  throw new OpenCliSnapshotError(400,"Browser record does not match requested product link.");
 if(raw.sourceProductId!==undefined&&string(raw.sourceProductId,30)!==id.productId)
  throw new OpenCliSnapshotError(400,"Browser record has a different product ID.");
 const title=string(raw.title,250);
 if(!title)throw new OpenCliSnapshotError(400,"Browser page did not provide a product title.");
 const unique=(items:unknown,max:number):string[]=>Array.isArray(items)?[...new Set(items.map(image).filter((v):v is string=>v!==null))].slice(0,max):[];
 const images=unique(raw.images,MAX_IMAGES);
 const detailImages=unique(raw.detailImages,24);
 if(images.length===0&&detailImages.length===0)throw new OpenCliSnapshotError(400,"No usable marketplace product images were found.");
 const tiers=Array.isArray(raw.priceTiers)?raw.priceTiers.slice(0,30).map(t=>{
  const entry=obj(t),quantity=number(entry.minQuantity,100000),price=number(entry.priceCNY);
  return quantity!==null&&Number.isInteger(quantity)&&quantity>=1&&price!==null?{minQuantity:quantity,priceCNY:price}:null;
 }).filter((x):x is OpenCliPriceTier=>x!==null):[];
 const specs=Array.isArray(raw.sourceSpecs)?raw.sourceSpecs.slice(0,40).map(value=>{
  const s=obj(value),name=string(s.name,90),v=string(s.value,220);
  return name&&v?{name,value:v}:null;
 }).filter((x):x is {name:string;value:string}=>x!==null):[];
 const recorded=string(raw.collectedAt,40);
 const collectedAt=recorded&&!Number.isNaN(Date.parse(recorded))?new Date(recorded).toISOString():new Date().toISOString();
 const amount=number(raw.priceCNY);
 const moq=number(raw.moq,100000);
 return {version:1,provider:"opencli-browser",originalMarketplaceUrl:source!,
  marketplace:id.marketplace as "1688"|"Taobao",sourceProductId:id.productId,title,
  sellerName:string(raw.sellerName,160)||null,images,detailImages,priceCNY:amount,
  moq:moq!==null&&Number.isInteger(moq)&&moq>=1?moq:null,priceTiers:tiers,
  sourceSpecs:specs,collectedAt};
}
export function openCliSnapshotPath(url:string):string|null{
 const normalized=normalizeMarketplaceLink(url);
 const id=marketplaceIdentity(normalized);
 if(!normalized||!id||!["1688","Taobao"].includes(id.marketplace))return null;
 return PREFIX+createHash("sha256").update(normalized).digest("hex")+".json";
}
export const OPENCLI_SNAPSHOT_PREFIX=PREFIX;
export async function getOpenCliSnapshot(url:string):Promise<OpenCliSnapshot|null>{
 const path=openCliSnapshotPath(url);
 if(!path||!process.env.BLOB_READ_WRITE_TOKEN)return null;
 try{
  const file=await get(path,{access:"private"});
  if(!file||file.statusCode!==200||!file.stream)return null;
  const body=await new Response(file.stream).text();
  if(body.length>30000)return null;
  const stored=obj(JSON.parse(body));
  if(stored.version!==1||stored.provider!=="opencli-browser")return null;
  return normalize(stored,url);
 }catch{return null;}
}
export async function saveOpenCliSnapshot(url:string,input:unknown):Promise<"saved"|"existing">{
 const path=openCliSnapshotPath(url);
 if(!path)throw new OpenCliSnapshotError(400,"Unsupported marketplace link.");
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw new OpenCliSnapshotError(503,"Private snapshot storage is not configured.");
 const snapshot=normalize(input,url);
 try{
  await put(path,JSON.stringify(snapshot),{
   access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"
  });
  return "saved";
 }catch{
  const existing=await getOpenCliSnapshot(url);
  if(existing)return "existing";
  throw new OpenCliSnapshotError(503,"Browser snapshot could not be stored safely.");
 }
}
export function mergeOpenCliProduct(product:Product,snapshot:OpenCliSnapshot|null):Product{
 if(!snapshot||normalizeMarketplaceLink(product.originalMarketplaceUrl)!==snapshot.originalMarketplaceUrl)return product;
 const photos=[...new Set([...(product.images||[]),...snapshot.images])]
  .filter(v=>/^https:\/\//.test(v)).slice(0,36);
 const details=[...new Set([...(product.detailImages||[]),...snapshot.detailImages])].slice(0,30);
 return {...product,
  // Catalogue title and GBP reference price retain their existing editorial identity.
  imageUrl:product.imageUrl||snapshot.images[0],
  images:photos,
  sellerName:product.sellerName||snapshot.sellerName,
  priceCNY:snapshot.priceCNY??product.priceCNY,
  detailImages:details,
  sourceSpecs:product.sourceSpecs?.length?product.sourceSpecs:snapshot.sourceSpecs,
  // Product option SKUs are NEVER inferred from prices or images.
  // Genuine marketplace variants remain unchanged until independently verified.
 };
}
