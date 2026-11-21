import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";

/**
 * Verify the exact received request bytes. A webhook must have a valid
 * HMAC-SHA256 signature before its JSON or event type is trusted.
 *
 * Supported signature envelopes:
 * - X-Webhook-Signature: t=<unix timestamp>,v1=<digest>
 * - X-Webhook-Signature: sha256=<hex> or bare 64-character hex
 * - X-Webhook-Signature: v1=<digest> or v1,<base64>
 * - X-Webhook-Timestamp together with any of the digest-only formats
 *
 * The t= signature wrapper was missing previously, causing genuine
 * timestamped deliveries to be rejected with HTTP 401.
 */
const MAX_SIGNATURE_LENGTH=512;
const MAX_SKEW_SECONDS=300;

function timestampValid(value:string):boolean{
  if(!/^\d{10,13}$/.test(value))return false;
  const raw=Number(value);
  const seconds=value.length===13?raw/1000:raw;
  return Number.isFinite(seconds) &&
    Math.abs(Date.now()/1000-seconds)<=MAX_SKEW_SECONDS;
}

function keysFromSecret(secret:string):Buffer[]{
  const keys=[Buffer.from(secret,"utf8")];
  if(secret.startsWith("whsec_")){
    const part=secret.slice(6);
    if(/^[A-Za-z0-9_-]{40,90}$/.test(part)){
      const bytes=Buffer.from(part,"base64url");
      if(bytes.length>=24&&bytes.length<=64)keys.unshift(bytes);
    }
  }
  return keys;
}

function digestBytes(encoded:string):Buffer|null{
  const value=encoded.trim();
  if(/^[a-fA-F0-9]{64}$/.test(value))return Buffer.from(value,"hex");
  if(/^[A-Za-z0-9+/]{43}=$/.test(value)){
    const b=Buffer.from(value,"base64");
    return b.length===32?b:null;
  }
  if(/^[A-Za-z0-9_-]{43}$/.test(value)){
    const b=Buffer.from(value,"base64url");
    return b.length===32?b:null;
  }
  return null;
}

function parseSignature(raw:string):{timestamp?:string;digests:Buffer[]}|null{
  const s=raw.trim();
  if(!s||s.length>MAX_SIGNATURE_LENGTH)return null;
  const pieces=s.split(",").map(x=>x.trim());
  const hasTimestamp=pieces.some(x=>x.startsWith("t="));
  if(hasTimestamp){
    if(pieces.length>5||pieces.some(x=>!x.startsWith("t=")&&!x.startsWith("v1=")))return null;
    const stamps=pieces.filter(x=>x.startsWith("t="));
    if(stamps.length!==1)return null;
    const timestamp=stamps[0].slice(2);
    if(!timestampValid(timestamp))return null;
    const digests=pieces.filter(x=>x.startsWith("v1="))
      .map(x=>digestBytes(x.slice(3))).filter((x):x is Buffer=>x!==null);
    return digests.length?{timestamp,digests}:null;
  }
  // Standard Webhooks sometimes sends space-separated v1,<base64> values.
  if(s.includes("v1,")){
    const values=s.split(/\s+/);
    if(values.length>4||values.some(x=>!x.startsWith("v1,")))return null;
    const digests=values.map(x=>digestBytes(x.slice(3)))
      .filter((x):x is Buffer=>x!==null);
    return digests.length?{digests}:null;
  }
  let value=s;
  if(value.startsWith("sha256="))value=value.slice(7);
  else if(value.startsWith("v1="))value=value.slice(3);
  const bytes=digestBytes(value);
  return bytes?{digests:[bytes]}:null;
}

export function verifyPartnerWebhook(
  body:Buffer,signatureHeader:string|null,secret:string,headers:Headers
):boolean{
  if(!signatureHeader||!secret||body.length===0)return false;
  const parsed=parseSignature(signatureHeader);
  if(!parsed)return false;
  const standaloneTimestamp=headers.get("x-webhook-timestamp");
  const standardTimestamp=headers.get("webhook-timestamp");
  const standardId=headers.get("webhook-id");
  if(standaloneTimestamp&&!timestampValid(standaloneTimestamp))return false;
  if(standardTimestamp&&!timestampValid(standardTimestamp))return false;
  if((standardId&&!standardTimestamp)||(!standardId&&standardTimestamp))return false;
  if(parsed.timestamp&&standaloneTimestamp&&parsed.timestamp!==standaloneTimestamp)return false;

  // Timestamped envelopes always sign the timestamp + period + raw bytes.
  // Do not attempt unsigned or raw-body fallback when a timestamp exists.
  let signedBody:Buffer;
  if(standardId&&standardTimestamp){
    if(parsed.timestamp&&parsed.timestamp!==standardTimestamp)return false;
    signedBody=Buffer.concat([Buffer.from(standardId+"."+standardTimestamp+"."),body]);
  }else{
    const time=parsed.timestamp||standaloneTimestamp;
    signedBody=time?Buffer.concat([Buffer.from(time+"."),body]):body;
  }
  for(const key of keysFromSecret(secret)){
    const computed=createHmac("sha256",key).update(signedBody).digest();
    for(const claimed of parsed.digests){
      if(claimed.length===computed.length&&timingSafeEqual(claimed,computed))
        return true;
    }
  }
  return false;
}
