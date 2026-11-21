import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";

/**
 * Verify signed raw bytes only, never JSON.parse -> JSON.stringify.
 * Supports HMAC-SHA256 raw-body signatures and Standard Webhooks-style
 * id.timestamp.body signatures. This does not trust unsigned payloads.
 *
 * Verify provider-specific signature header formatting with a genuine test
 * delivery before enabling order event processing.
 */
function equals(actual:string,expected:string):boolean {
  const a=Buffer.from(actual);
  const b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}
function validTimestamp(value:string):boolean {
  if(!/^\d{10,13}$/.test(value))return false;
  const seconds=Number(value.length===13?Number(value)/1000:value);
  return Number.isFinite(seconds)&&Math.abs(Date.now()/1000-seconds)<=300;
}
function secretKeys(secret:string):Buffer[] {
  const keys=[Buffer.from(secret,"utf8")];
  if(secret.startsWith("whsec_")){
    const part=secret.slice(6);
    if(/^[A-Za-z0-9_-]{40,90}$/.test(part)){
      const decoded=Buffer.from(part,"base64url");
      if(decoded.length>=24&&decoded.length<=64)keys.unshift(decoded);
    }
  }
  return keys;
}
export function verifyPartnerWebhook(
  body:Buffer,
  signatureHeader:string|null,
  secret:string,
  headers:Headers
):boolean {
  if(!signatureHeader||!secret||signatureHeader.length>512)return false;
  const sig=signatureHeader.trim();
  const id=headers.get("webhook-id");
  const time=headers.get("webhook-timestamp");
  const xTime=headers.get("x-webhook-timestamp");
  if((id||time)&&(!id||!time||!validTimestamp(time)))return false;
  if(xTime&&!validTimestamp(xTime))return false;
  // Only a signed delivery may reach the event handler. Reject unknown
  // algorithms or unrecognized signature encodings.
  const signedPayload=id&&time
    ?Buffer.from(id+"."+time+"."+body.toString("utf8"),"utf8")
    :xTime?Buffer.from(xTime+"."+body.toString("utf8"),"utf8"):body;
  for(const key of secretKeys(secret)){
    const mac=createHmac("sha256",key).update(signedPayload).digest();
    const hex=mac.toString("hex"), base64=mac.toString("base64");
    const accepted=[
      "sha256="+hex,hex,
      "v1="+hex,"v1,"+base64,
      "v1="+base64
    ];
    if(accepted.some(candidate=>equals(sig,candidate)))return true;
  }
  return false;
}
