import "server-only";
import type {QuoteRequest} from "@/lib/quote-requests";

function emailAddress(value:unknown):string|null{
 return typeof value==="string"&&value.length<180&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?value:null;
}
function clean(value:string){return value.replace(/[\r\n\x00-\x1f\x7f]/g," ").slice(0,180);}
async function send(to:string,subject:string,body:string):Promise<boolean>{
 const token=process.env.RESEND_API_KEY;
 if(!token?.startsWith("re_"))return false;
 const from=process.env.HEROCON_QUOTE_EMAIL_FROM||"Herocon <no-reply@herocon.store>";
 const fromValid=/^[^<>]{1,80}<[^<>@\s]+@herocon\.store>$/.test(from);
 if(!fromValid)return false;
 try{
  const response=await fetch("https://api.resend.com/emails",{
   method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
   body:JSON.stringify({from,to:[to],subject,text:body}),
   cache:"no-store",redirect:"error",signal:AbortSignal.timeout(8000)
  });
  return response.ok;
 }catch{return false;}
}
/** Sends only after first successful immutable storage write; no third-party notification failures can undo the request. */
export async function notifyNewQuoteRequest(request:QuoteRequest):Promise<{merchant:boolean;customer:boolean}>{
 const merchant=emailAddress(process.env.HEROCON_QUOTE_ALERT_EMAIL)||"aminabdul339@outlook.com";
 const buyer=emailAddress(request.customerEmail);
 const lines=request.lines.map((l,i)=>[
  String(i+1)+". "+clean(l.title),
  "Variant: "+clean(l.variant||"Not specified"),
  "SKU: "+clean(l.skuCode||"Not selected"),
  "Quantity: "+l.quantity,
  "Supplier: "+l.marketplaceUrl
 ].join("\n")).join("\n\n");
 const merchantBody=[
  "New Herocon quote request (NOT a paid order)","","Reference: "+request.id,
  "Customer: "+request.customerEmail,"UK postcode: "+request.postcode,
  "Notes: "+(request.notes||"None"),"",lines,"",
  "Review securely at https://herocon.store/admin/checkout",
  "Do not treat this request as payment or supplier authorisation."
 ].join("\n");
 const customerBody=[
  "Herocon has received your free product quote request.","",
  "Reference: "+request.id,"Requested items: "+request.lines.length,
  "UK postcode: "+request.postcode,"",
  "Your request is NOT an order. No payment has been taken. Product ordering and international shipping checkout are not currently available.","",
  "Track your request at https://herocon.store/account/quotes","",
  "Contact support: aminabdul339@outlook.com"
 ].join("\n");
 const [m,c]=await Promise.all([
  send(merchant,"Herocon quote request "+request.id,merchantBody),
  buyer?send(buyer,"We received your Herocon quote request",customerBody):Promise.resolve(false)
 ]);
 return {merchant:m,customer:c};
}
