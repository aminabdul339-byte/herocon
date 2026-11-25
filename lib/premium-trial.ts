import "server-only";
import {get} from "@vercel/blob";
import {createHash} from "node:crypto";
import type {Customer} from "@/lib/customer-auth";
import {createTrial,validTrial,trialActive,type TrialRecord} from "@/lib/premium-trial-model";
const emailOf=(u:Customer)=>u.email.trim().toLowerCase();
const path=(email:string)=>"membership/premium-trial/v1/"+createHash("sha256").update(email).digest("hex")+".json";
async function request(u:Customer,method:"GET"|"POST",startedAt?:string){
 const url=new URL("/rest/v1/herocon_premium_trials",process.env.HEROCON_SUPABASE_URL!);
 if(method==="GET"){url.searchParams.set("email","eq."+emailOf(u));url.searchParams.set("select","started_at");}
 else url.searchParams.set("on_conflict","email");
 const r=await fetch(url,{method,headers:{apikey:process.env.HEROCON_SUPABASE_PUBLISHABLE_KEY!,Authorization:"Bearer "+u.accessToken,"Content-Type":"application/json",...(method==="POST"?{Prefer:"resolution=ignore-duplicates,return=minimal"}:{})},...(method==="POST"?{body:JSON.stringify({email:emailOf(u),started_at:startedAt})}:{}),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error("Trial database unavailable ("+r.status+").");
 return method==="GET"?await r.json():null;
}
async function databaseTrial(u:Customer):Promise<TrialRecord|null>{
 const rows=await request(u,"GET");if(!Array.isArray(rows)||rows.length>1)throw Error("Invalid trial response.");
 if(!rows.length)return null;const start=Date.parse(rows[0].started_at);if(!Number.isFinite(start))throw Error("Invalid trial start.");return createTrial(start);
}
async function legacyTrial(u:Customer):Promise<TrialRecord|null>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return null;
 try{const r=await get(path(emailOf(u)),{access:"private",useCache:false});if(!r||r.statusCode===404)return null;if(r.statusCode!==200||!r.stream)return null;const data=JSON.parse(await new Response(r.stream).text());return validTrial(data)?data:null;}catch{return null;}
}
export async function readPremiumTrial(u:Customer):Promise<TrialRecord|null>{
 const [db,legacy]=await Promise.all([databaseTrial(u),legacyTrial(u)]);
 if(db&&legacy)return Date.parse(db.startedAt)<=Date.parse(legacy.startedAt)?db:legacy;
 return db||legacy;
}
export async function startPremiumTrial(u:Customer,verifiedAt?:string):Promise<TrialRecord>{
 const prior=await readPremiumTrial(u);
 const verified=verifiedAt?Date.parse(verifiedAt):NaN;
 const proposed=prior||createTrial(Number.isFinite(verified)&&verified<=Date.now()?verified:Date.now());
 await request(u,"POST",proposed.startedAt);
 const actual=await readPremiumTrial(u);if(!actual)throw Error("Trial activation could not be confirmed.");return actual;
}
export async function activePremiumTrial(u:Customer){try{const trial=await readPremiumTrial(u);return trialActive(trial)?trial:null;}catch(e){console.warn("herocon-trial-database",e instanceof Error?e.message:"Unavailable");return null;}}
