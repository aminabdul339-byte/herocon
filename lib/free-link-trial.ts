import "server-only";
import {get,put} from "@vercel/blob";
import {createHash} from "node:crypto";
export const FREE_MONTHLY_LINKS=3;
const prefix=(uid:string)=>"membership/link-trial/v2/"+createHash("sha256").update(uid).digest("hex")+"/"+new Date().toISOString().slice(0,7)+"/";
type Claim={url:string;createdAt:string};
async function read(path:string):Promise<Claim|null>{
 const r=await get(path,{access:"private",useCache:false});if(!r)return null;
 if(r.statusCode!==200||!r.stream)throw Error("Lookup storage unavailable");
 const d=JSON.parse(await new Response(r.stream).text());if(typeof d.url!=="string")throw Error("Invalid lookup record");return d;
}
export async function claimLinkTrial(uid:string,url:string){
 const root=prefix(uid);const keys=Array.from({length:FREE_MONTHLY_LINKS},(_,i)=>root+(i+1)+".json");
 for(const key of keys){const previous=await read(key);if(previous?.url===url)return true;}
 for(const key of keys){const previous=await read(key);if(previous?.url===url)return true;if(previous)continue;
  try{await put(key,JSON.stringify({url,createdAt:new Date().toISOString()}),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});return true;}
  catch{const actual=await read(key);if(actual?.url===url)return true;if(!actual)throw Error("Lookup storage unavailable");}
 }
 return false;
}
