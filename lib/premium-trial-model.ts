export const TRIAL_MS=72*60*60*1000;
export type TrialRecord={version:1;startedAt:string;endsAt:string};
export function createTrial(now:number):TrialRecord{return {version:1,startedAt:new Date(now).toISOString(),endsAt:new Date(now+TRIAL_MS).toISOString()};}
export function validTrial(value:unknown):value is TrialRecord{if(!value||typeof value!=="object")return false;const t=value as TrialRecord;return t.version===1&&typeof t.startedAt==="string"&&typeof t.endsAt==="string"&&Number.isFinite(Date.parse(t.startedAt))&&Date.parse(t.endsAt)-Date.parse(t.startedAt)===TRIAL_MS;}
export function trialActive(t:TrialRecord|null,now=Date.now()){return !!t&&validTrial(t)&&Date.parse(t.startedAt)<=now&&now<Date.parse(t.endsAt);}

export function resolvePremiumEntitlement(owner:boolean,paid:boolean,trial:TrialRecord|null,now=Date.now()){if(owner||paid)return {premium:true,trialEndsAt:null};if(trial&&trialActive(trial,now))return {premium:true,trialEndsAt:trial.endsAt};return {premium:false,trialEndsAt:null};}

/** Round up a partial minute so the display reaches all zeros only at expiry. */
export function trialCountdown(endsAt:string,now:number){const end=Date.parse(endsAt);const ms=Number.isFinite(end)&&Number.isFinite(now)?Math.max(0,Math.min(TRIAL_MS,end-now)):0;const total=Math.ceil(ms/60000);return {days:Math.floor(total/1440),hours:Math.floor(total%1440/60),minutes:total%60,expired:ms===0};}
