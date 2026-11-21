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
  constructor(
    public readonly status:number,
    public readonly code:string,
    public readonly requestId?:string
  ) {
    super("Partner service request failed.");
  }
}
// Only expose recognised public API error codes from the provider, never
// user data, API key values or arbitrary upstream response text.
const KNOWN_ERRORS=new Set([
  "invalid_api_key","account_action_required","api_not_enabled",
  "insufficient_scope","validation_failed","rate_limited",
  "internal_error","not_found"
]);
function providerError(body:unknown):string|null{
  if(!body||typeof body!=="object"||Array.isArray(body))return null;
  const value=body as Record<string,unknown>;
  const inner=value.error&&typeof value.error==="object"&&!Array.isArray(value.error)
    ?value.error as Record<string,unknown>:null;
  const candidate=typeof value.code==="string"?value.code:
    typeof value.error==="string"?value.error:
    typeof inner?.code==="string"?inner.code:null;
  return candidate&&KNOWN_ERRORS.has(candidate)?candidate:null;
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
    const requestIdRaw=response.headers.get("x-request-id")||"";
    const requestId=/^[A-Za-z0-9_-]{3,128}$/.test(requestIdRaw)?requestIdRaw:undefined;
    let errorCode:string|null=null;
    if(response.headers.get("content-type")?.includes("application/json")){
      try{errorCode=providerError(await response.json());}catch{}
    }
    const fallback=response.status===401?"invalid_api_key":
      response.status===403?"partner_permission_or_account":
      response.status===429?"rate_limited":"partner_api_error";
    throw new PartnerReadError(response.status,errorCode||fallback,requestId);
  }
  try {return await response.json();}
  catch{throw new PartnerReadError(502,"invalid_partner_response");}
}
