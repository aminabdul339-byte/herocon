/**
 * Checkout URLs must be Herocon production, unless the owner explicitly
 * enabled payments on ONE protected Vercel preview deployment.
 * Never trust client Origin, Host, X-Forwarded-Host or an arbitrary callback.
 */
export function checkoutOriginFor(requestUrl:string):string|null{
 let incoming:URL;
 try{incoming=new URL(requestUrl);}catch{return null;}
 if(incoming.origin==="https://herocon.store")return incoming.origin;
 const platformHost=process.env.VERCEL_URL||"";
 if(process.env.VERCEL_ENV==="preview"&&
  process.env.HEROCON_ALLOW_PREVIEW_OWNER_PAYMENT==="true"&&
  /^[a-z0-9][a-z0-9-]*\.vercel\.app$/.test(platformHost)&&
  incoming.origin==="https://"+platformHost)return incoming.origin;
 return null;
}
