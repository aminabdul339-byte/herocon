import "server-only";

/**
 * Read-only Fulfillbot bridge. This module has no write methods and never
 * accepts an arbitrary upstream URL from a browser or webhook payload.
 * An API key stays in the Vercel server environment, never in client JS.
 */
const API_ORIGIN = "https://api.fulfillbot.com/v1";

export type PartnerReadResource =
  "me"|"wallet"|"products"|"inventory"|"orders"|"purchase-orders"|
  "shipments"|"requests"|"quotes";

const ALLOWED: ReadonlySet<string> = new Set([
  "me","wallet","products","inventory","orders","purchase-orders",
  "shipments","requests","quotes"
]);

export class PartnerReadError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super("Partner service request failed.");
  }
}

export function partnerKeyConfigured() {
  return Boolean(process.env.FULFILLBOT_API_KEY?.trim());
}

export async function partnerRead(
  resource: PartnerReadResource,
  options: {id?:string;page?:number}={}
): Promise<unknown> {
  if (!ALLOWED.has(resource)) throw new PartnerReadError(400,"unsupported_resource");
  const apiKey=process.env.FULFILLBOT_API_KEY?.trim();
  if (!apiKey) throw new PartnerReadError(503,"not_configured");
  const id=options.id;
  if(id && (!/^[a-zA-Z0-9_-]{5,128}$/.test(id) || resource==="me" || resource==="wallet" || resource==="inventory"))
    throw new PartnerReadError(400,"invalid_resource_id");
  const page=options.page;
  if(page!==undefined && (!Number.isInteger(page) || page<1 || page>10000 || Boolean(id)))
    throw new PartnerReadError(400,"invalid_page");
  const suffix="/"+resource+(id?"/"+encodeURIComponent(id):"")+
    (page!==undefined?"?page="+page:"");
  let response:Response;
  try {
    response=await fetch(API_ORIGIN+suffix,{
      method:"GET",
      headers:{"Authorization":"Bearer "+apiKey,"Accept":"application/json"},
      cache:"no-store",
      signal:AbortSignal.timeout(7000),
    });
  }catch{
    throw new PartnerReadError(503,"partner_unavailable");
  }
  if(!response.ok) {
    if(response.status===401) throw new PartnerReadError(401,"invalid_partner_key");
    if(response.status===403) throw new PartnerReadError(403,"partner_permission_or_account");
    if(response.status===429) throw new PartnerReadError(429,"partner_rate_limited");
    throw new PartnerReadError(502,"partner_api_error");
  }
  try {return await response.json();}
  catch{throw new PartnerReadError(502,"invalid_partner_response");}
}
