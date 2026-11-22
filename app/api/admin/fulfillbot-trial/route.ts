import {createHash, timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {getProducts} from "@/lib/catalogue-server";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {productId} from "@/lib/catalogue";
import {partnerKeyConfigured, partnerRead, PartnerReadError} from "@/lib/fulfillbot-read";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const CONFIRM="SEND_FULFILLBOT_QUOTE_REQUEST";
const API="https://api.fulfillbot.com/v1/requests/sourcing";

function reply(value:unknown,status=200) {
  return NextResponse.json(value,{status,headers:HEADERS});
}

/** Only the existing Herocon server-side owner key can access this test route. */
function ownerAuthorised(request:Request):boolean {
  const expected=process.env.HEROCON_CHECKOUT_ADMIN_KEY?.trim();
  const actual=request.headers.get("x-herocon-admin-key")?.trim();
  if(!expected||!actual||expected.length>512||actual.length>512)return false;
  const a=createHash("sha256").update(expected).digest();
  const b=createHash("sha256").update(actual).digest();
  return timingSafeEqual(a,b);
}

function asRecord(value:unknown):Record<string,unknown>|null {
  return value!==null&&typeof value==="object"&&!Array.isArray(value)
    ?value as Record<string,unknown>:null;
}
function valueString(value:unknown):string {
  return typeof value==="string"?value.trim():"";
}

export async function GET(request:Request) {
  if(!ownerAuthorised(request))return reply({ok:false,error:"unauthorised"},401);
  if(!partnerKeyConfigured())return reply({ok:false,error:"fulfillbot_key_not_configured"},503);
  try {
    const raw=asRecord(await partnerRead("me"));
    const data=asRecord(raw?.data);
    const apiKey=asRecord(data?.apiKey);
    const customer=asRecord(data?.customer);
    return reply({
      ok:true,
      connected:true,
      customerName:valueString(customer?.name),
      scopes:Array.isArray(apiKey?.scopes)?apiKey.scopes.filter(v=>typeof v==="string"):[],
      trialSubmissionEnabled:process.env.FULFILLBOT_TRIAL_SUBMISSION_ENABLED==="true"
    });
  } catch(error) {
    const code=error instanceof PartnerReadError?error.code:"partner_unavailable";
    return reply({ok:false,error:code},503);
  }
}

export async function POST(request:Request) {
  if(!ownerAuthorised(request))return reply({ok:false,error:"unauthorised"},401);
  if(!request.headers.get("content-type")?.includes("application/json"))
    return reply({ok:false,error:"json_required"},415);

  let input:Record<string,unknown>|null=null;
  try {
    const raw=await request.text();
    if(!raw||raw.length>8192)return reply({ok:false,error:"invalid_request_size"},413);
    input=asRecord(JSON.parse(raw));
  } catch {return reply({ok:false,error:"invalid_json"},400);}
  if(!input)return reply({ok:false,error:"invalid_body"},400);

  const mode=valueString(input.mode)||"preview";
  if(mode!=="preview"&&mode!=="submit")
    return reply({ok:false,error:"invalid_mode"},400);
  const id=valueString(input.productId);
  if(!/^[A-Za-z0-9_-]{5,100}$/.test(id))
    return reply({ok:false,error:"invalid_product_id"},400);
  const specs=valueString(input.specs);
  if(specs.length>1000)return reply({ok:false,error:"specs_too_long"},400);
  const countryCode=(valueString(input.countryCode)||"GB").toUpperCase();
  if(!/^[A-Z]{2}$/.test(countryCode))
    return reply({ok:false,error:"invalid_country"},400);

  // Look up the product on Herocon's server. The client cannot substitute
  // an arbitrary marketplace URL, seller, quantity or product title.
  let product;
  try {
    const catalogue=await getProducts();
    product=catalogue.find(item=>productId(item)===id||item.canonicalId===id);
  } catch {return reply({ok:false,error:"catalogue_unavailable"},503);}
  if(!product)return reply({ok:false,error:"product_not_found"},404);
  const sourceUrl=normalizeMarketplaceLink(product.originalMarketplaceUrl);
  if(!sourceUrl)return reply({ok:false,error:"verified_marketplace_link_missing"},422);
  if((product.variantCount||product.variants?.length||0)>1&&!specs)
    return reply({ok:false,error:"variant_specification_required"},422);

  const title=(product.originalTitle||product.displayTitle||product.title).trim().slice(0,200);
  const body={
    countryCode,
    purpose:"SHIP_TO_ME",
    note:"Herocon one-unit trial sourcing quote. Do not purchase before the quote is approved in the Fulfillbot portal.",
    items:[{
      productUrl:sourceUrl,
      title,
      specs,
      sourceCustomerSku:("HEROCON-"+id).slice(0,100),
      qty:1
    }]
  };
  const idempotencyKey="herocon-trial-"+createHash("sha256")
    .update(JSON.stringify(body)).digest("hex");
  const summary={
    productId:id,
    title,
    marketplaceUrl:sourceUrl,
    countryCode,
    specs,
    quantity:1,
    purpose:"SHIP_TO_ME" as const
  };

  if(mode==="preview")return reply({
    ok:true,mode:"preview",summary,
    submitted:false,
    submissionEnabled:process.env.FULFILLBOT_TRIAL_SUBMISSION_ENABLED==="true",
    note:"This preview is generated by Herocon. No Fulfillbot request has been sent and no live price has been checked."
  });

  // A sourcing request asks Fulfillbot for a QUOTE, not an order or payment.
  // Both a separately enabled flag and explicit operator confirmation are required.
  if(input.confirm!==CONFIRM)
    return reply({ok:false,error:"explicit_confirmation_required",required:CONFIRM},400);
  if(process.env.FULFILLBOT_TRIAL_SUBMISSION_ENABLED!=="true")
    return reply({ok:false,error:"trial_submission_disabled"},403);
  const key=process.env.FULFILLBOT_API_KEY?.trim();
  if(!key)return reply({ok:false,error:"fulfillbot_key_not_configured"},503);

  let upstream:Response;
  try {
    upstream=await fetch(API,{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+key,
        "Content-Type":"application/json",
        "Accept":"application/json",
        "Idempotency-Key":idempotencyKey
      },
      body:JSON.stringify(body),
      cache:"no-store",
      redirect:"error",
      signal:AbortSignal.timeout(15000)
    });
  } catch {return reply({ok:false,error:"partner_unavailable"},503);}
  let output:Record<string,unknown>|null=null;
  try {output=asRecord(await upstream.json());} catch{}
  if(!upstream.ok) {
    const e=asRecord(output?.error);
    const upstreamCode=valueString(e?.code)||valueString(output?.code);
    const allowed=["invalid_api_key","api_not_enabled","insufficient_scope","account_on_hold",
      "validation_failed","unknown_country","rate_limited","request_in_progress",
      "idempotency_key_reused","request_rejected"];
    return reply({
      ok:false,
      error:allowed.includes(upstreamCode)?upstreamCode:"fulfillbot_request_failed"
    },upstream.status>=400&&upstream.status<600?upstream.status:502);
  }
  const result=asRecord(output?.data);
  if(!result||!valueString(result.id))
    return reply({ok:false,error:"unexpected_partner_response"},502);
  return reply({
    ok:true,mode:"submitted",summary,submitted:true,
    requestId:result.id,
    requestNumber:result.number,
    status:result.status,
    nextStep:"Review the sourcing quote in Fulfillbot before authorising any purchase."
  },201);
}
