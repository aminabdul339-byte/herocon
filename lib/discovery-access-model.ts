export const CUSTOMER_DAILY_LIVE_SEARCH_LIMIT=10;
export const SHARED_DAILY_LIVE_SEARCH_LIMIT=20;
export function discoveryAllowed(owner:boolean,premium:boolean,action:unknown){
 if(owner)return ["parse","search","image","detail","history","saved"].includes(String(action));
 return premium&&["search","image","detail"].includes(String(action));
}
export function utcDay(now:number){return new Date(now).toISOString().slice(0,10);}
