import "server-only";
import {get} from "@vercel/blob";
import {createHash} from "node:crypto";
import type {Customer} from "@/lib/customer-auth";
import {createTrial,validTrial,trialActive,type TrialRecord} from "@/lib/premium-trial-model";
const emailOf=(u:Customer)=>u.email.trim().toLowerCase();
const path=(email:string)=>"membership/premium-trial/v1/"+createHash("sha256").update(email).digest("hex")+".json";
async function request(u:Customer){
 const url=new URL("/rest/v1/herocon_premium_trials",process.env.HEROCON_SUPABASE_URL!);
 url.searchParams.set("email","eq."+emailOf(u));url.searchParams.set("select","started_at");
 const r=await fetch(url,{method:"GET",headers:{apikey:process.env.HEROCON_SUPABASE_PUBLISHABLE_KEY!,Authorization:"Bearer "+u.accessToken},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error("Trial database unavailable ("+r.status+").");
 return await r.json();
}
async function databaseTrial(u:Customer):Promise<TrialRecord|null>{
 const rows=await request(u);if(!Array.isArray(rows)||rows.length>1)throw Error("Invalid trial response.");
 if(!rows.length)return null;const start=Date.parse(rows[0].started_at);if(!Number.isFinite(start))throw Error("Invalid trial start.");return createTrial(start);
}
async function legacyTrial(u:Customer):Promise<TrialRecord|null>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return null;
 try{const r=await get(path(emailOf(u)),{access:"private",useCache:false});if(!r)return null;if(r.statusCode!==200||!r.stream)return null;const data=JSON.parse(await new Response(r.stream).text());return validTrial(data)?data:null;}catch{return null;}
}
export async function readPremiumTrial(u:Customer):Promise<TrialRecord|null>{
 const [db,legacy]=await Promise.all([databaseTrial(u),legacyTrial(u)]);
 if(db&&legacy)return Date.parse(db.startedAt)<=Date.parse(legacy.startedAt)?db:legacy;
 return db||legacy;
}
// Public self-activation is retired. Future promotions require an explicit privileged grant.
export async function startPremiumTrial(u:Customer,_verifiedAt?:string):Promise<TrialRecord>{
 const prior=await readPremiumTrial(u);if(prior)return prior;
 throw Error("New public Premium trials are no longer offered.");
}
export async function activePremiumTrial(u:Customer){try{const trial=await readPremiumTrial(u);return trialActive(trial)?trial:null;}catch(e){console.warn("herocon-trial-database",e instanceof Error?e.message:"Unavailable");return null;}}
