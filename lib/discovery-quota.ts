import "server-only";
import {createHash} from "node:crypto";
import {list,put} from "@vercel/blob";
import {CUSTOMER_DAILY_LIVE_SEARCH_LIMIT,SHARED_DAILY_LIVE_SEARCH_LIMIT,utcDay} from "@/lib/discovery-access-model";
// Immutable numbered claims make the upper bounds effective across instances.
// Failed calls consume a slot conservatively. No automatic provider retries.
async function claim(prefix:string,limit:number){
 const page=await list({prefix,limit:limit+1});
 const used=new Set(page.blobs.map(b=>b.pathname));
 if(used.size>=limit)return false;
 for(let i=1;i<=limit;i++){
  const key=prefix+i+".json";if(used.has(key))continue;
  try{await put(key,"{}",{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});return true;}catch{/* Another request may have claimed this slot. Never overwrite. */}
 }
 return false;
}
export async function reserveDiscovery(uid:string){
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error("Quota storage unavailable.");
 const prefix="hiobuy/discovery-quota/v1/"+utcDay(Date.now())+"/";
 const account=createHash("sha256").update(uid).digest("hex");
 if(!await claim(prefix+"accounts/"+account+"/",CUSTOMER_DAILY_LIVE_SEARCH_LIMIT))return "account";
 if(!await claim(prefix+"shared/",SHARED_DAILY_LIVE_SEARCH_LIMIT))return "shared";
 return "ok";
}
