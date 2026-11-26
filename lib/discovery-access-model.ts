export const CUSTOMER_DAILY_LIVE_SEARCH_LIMIT=10;
export const SHARED_DAILY_LIVE_SEARCH_LIMIT=20;
export const INTRO_SHARED_DAILY_LIMIT=5;
export const LIVE_CREDITS={free:3,trial:15,premium:50} as const;
export type DiscoveryTier=keyof typeof LIVE_CREDITS;
export function discoveryAllowed(owner:boolean,premium:boolean,action:unknown){
 if(owner)return ["parse","search","image","detail","history","saved"].includes(String(action));
 return ["parse","search","image","detail"].includes(String(action));
}
export function utcDay(now:number){return new Date(now).toISOString().slice(0,10);}
export function creditPeriod(tier:DiscoveryTier,now:number){return tier==="premium"?utcDay(now).slice(0,7):"once";}
