import "server-only";
import {get,put} from "@vercel/blob";
import {createHash} from "node:crypto";
const path=(uid:string)=>"membership/link-trial/v1/"+createHash("sha256").update(uid).digest("hex")+".json";
type Claim={url:string;createdAt:string};
export async function linkTrial(uid:string):Promise<Claim|null>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error("Trial storage unavailable");
 const r=await get(path(uid),{access:"private",useCache:false});if(!r)return null;
 if(r.statusCode!==200||!r.stream)throw Error("Trial storage unavailable");
 const d=JSON.parse(await new Response(r.stream).text());if(typeof d.url!=="string")throw Error("Invalid trial record");return d;
}
/** One unique valid link per free account. Reopening that same link is safe
 * and does not spend another trial. Atomic create blocks parallel requests. */
export async function claimLinkTrial(uid:string,url:string){
 const existing=await linkTrial(uid);if(existing)return existing.url===url;
 try{await put(path(uid),JSON.stringify({url,createdAt:new Date().toISOString()}),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});return true;}
 catch{const previous=await linkTrial(uid);if(previous)return previous.url===url;throw Error("Trial storage unavailable");}
}
