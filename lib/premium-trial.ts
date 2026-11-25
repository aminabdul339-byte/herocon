import "server-only";
import {get,put} from "@vercel/blob";
import {createHash} from "node:crypto";
import type {Customer} from "@/lib/customer-auth";
import {createTrial,validTrial,trialActive,type TrialRecord} from "@/lib/premium-trial-model";
const path=(email:string)=>"membership/premium-trial/v1/"+createHash("sha256").update(email.trim().toLowerCase()).digest("hex")+".json";
export async function readPremiumTrial(customer:Customer):Promise<TrialRecord|null>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error("Trial storage unavailable.");
 const response=await get(path(customer.email),{access:"private",useCache:false});
 if(!response)return null;
 if(response.statusCode!==200||!response.stream)throw Error("Trial storage unavailable.");
 const data=JSON.parse(await new Response(response.stream).text());if(!validTrial(data))throw Error("Invalid trial record.");return data;
}
export async function startPremiumTrial(customer:Customer):Promise<TrialRecord>{
 const existing=await readPremiumTrial(customer);if(existing)return existing;
 const trial=createTrial(Date.now());
 try{await put(path(customer.email),JSON.stringify(trial),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});return trial;}
 catch{const prior=await readPremiumTrial(customer);if(prior)return prior;throw Error("Trial storage unavailable.");}
}
export async function activePremiumTrial(customer:Customer){try{const t=await readPremiumTrial(customer);return trialActive(t)?t:null;}catch{return null;}}
