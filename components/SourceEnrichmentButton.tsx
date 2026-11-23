"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";

type Result={
 ok?:boolean;error?:string;provider?:"public-page"|"hiobuy";
 images?:number;variants?:number;descriptionFound?:boolean;
 saved?:boolean;priceCNY?:number|null;note?:string
};
const explanations:Record<string,string>={
 marketplace_access_restricted:"The marketplace restricts automated access to this listing. We will not bypass its access controls. A licensed product-data API is needed for the full details.",
 marketplace_redirected:"The marketplace redirected the server to another page. Automatic off-site redirects are disabled for safety.",
 marketplace_unreachable:"Herocon couldn't reach this marketplace page.",
 marketplace_unavailable:"The original marketplace page isn't available to our server.",
 marketplace_non_html:"The supplier didn't return an HTML product page.",
 marketplace_page_too_large:"The supplier page is too large for a safe metadata-only check.",
 public_metadata_unavailable:"The page doesn't expose usable public product metadata. Its variants, photos and stock require an authorised product-data API.",
 hiobuy_not_configured:"The HioBuy API key hasn't been connected to Herocon.",
 CHANNEL_NOT_AUTHORIZED:"HioBuy has not enabled this marketplace channel for your app.",
 INVALID_API_KEY:"HioBuy rejected the configured API key.",
 PAID_SUBSCRIPTION_REQUIRED:"HioBuy requires an active paid subscription for this marketplace.",
 QUOTA_EXCEEDED:"HioBuy's product-detail quota has been exhausted.",
 hiobuy_unavailable:"The product-data provider is temporarily unreachable.",
 hiobuy_failed:"The product-data provider couldn't retrieve this listing.",
 enrichment_storage_unavailable:"Herocon needs its private product-storage connection to save the result.",
 enrichment_storage_failed:"Herocon retrieved the product but could not save it.",
 check_recently_requested:"This source was checked recently. Try again after 25 seconds.",
 owner_sign_in_required:"Sign in with your Herocon owner account to enrich a product."
};
export default function SourceEnrichmentButton({
 productId,collection
}:{productId:string;collection:"business"|"personal"}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<Result|null>(null);
 async function check(){
  if(busy)return;
  setBusy(true);setResult(null);
  try{
   const res=await fetch("/api/marketplace-enrichment",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({productId,collection})
   });
   const data=await res.json() as Result;
   setResult(data.ok?data:{ok:false,error:data.error||"enrichment_failed"});
   if(res.ok&&data.ok)router.refresh();
  }catch{setResult({ok:false,error:"enrichment_failed"});}
  finally{setBusy(false);}
 }
 return <section style={{
   border:"1px solid #d4dcca",padding:"20px 22px",background:"#f5f8f2",
   borderRadius:10,margin:"24px auto",maxWidth:1100,color:"#263f2c"
 }}>
  <p style={{letterSpacing:1.5,fontSize:11,fontWeight:800}}>OWNER TOOLS / ORIGINAL MARKETPLACE ENRICHMENT</p>
  <h2 style={{fontSize:19,margin:"8px 0"}}>Get more product details from the supplier link</h2>
  <p style={{fontSize:14,lineHeight:1.6,margin:"0 0 14px"}}>
   This check uses publicly accessible supplier page metadata, not BuckyDrop.
   When the optional HioBuy product-data key is connected, it can retrieve full
   marketplace details and real SKU selections. Results are saved to Herocon.
  </p>
  <button type="button" disabled={busy} onClick={()=>void check()}
   style={{
    background:"#264a32",color:"#fff",fontWeight:700,border:0,borderRadius:5,
    padding:"12px 16px",cursor:busy?"wait":"pointer",opacity:busy?.6:1
   }}>
    {busy?"Checking original listing…":"Enrich this product"}
  </button>
  {result?.ok?<p role="status" style={{fontSize:14,lineHeight:1.6,marginTop:13}}>
   Saved from <strong>{result.provider==="hiobuy"?"HioBuy Product API":"public marketplace metadata"}</strong>.
   Images found: <strong>{result.images||0}</strong>.
   Supplier SKUs found: <strong>{result.variants||0}</strong>.
   Description: <strong>{result.descriptionFound?"available":"not available"}</strong>.
   <span style={{display:"block",fontSize:12}}>{result.note}</span>
  </p>:result?.error?<p role="alert" style={{fontSize:14,lineHeight:1.5,color:"#9c3830",marginTop:13}}>
   {explanations[result.error]||"Supplier enrichment could not complete ("+result.error+")."}
  </p>:null}
 </section>;
}