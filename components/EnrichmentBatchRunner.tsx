"use client";
import {useState} from "react";
import Link from "next/link";

type Row={id:string;title:string;sourceUrl:string;saved:boolean;productPath:string;existingImages:number;existingVariants:number;hasDescription:boolean;hasSeller:boolean};
type Result={ok?:boolean;error?:string;provider?:string;images?:number;variants?:number;descriptionFound?:boolean};
export default function EnrichmentBatchRunner({
 collection,rows,page,total,providerConnected
}:{collection:"business"|"personal";rows:Row[];page:number;total:number;providerConnected:boolean}){
 const [running,setRunning]=useState(false);
 const [results,setResults]=useState<Record<string,Result>>({});
 const [processed,setProcessed]=useState(0);
 const pageCount=Math.ceil(total/12);
 async function run(){
  if(running||!providerConnected)return;
  setRunning(true);setProcessed(0);setResults({});
  let limited=0;
  for(const row of rows){
   if(row.saved){setResults(prev=>({...prev,[row.id]:{ok:true,provider:"Saved earlier"}}));continue;}
   let result:Result;
   try{
    const res=await fetch("/api/marketplace-enrichment",{
     method:"POST",headers:{"Content-Type":"application/json"},
     credentials:"same-origin",cache:"no-store",
     body:JSON.stringify({productId:row.id,collection})
    });
    result=await res.json() as Result;
   }catch{result={ok:false,error:"network_error"};}
   setResults(prev=>({...prev,[row.id]:result}));
   setProcessed(prev=>prev+1);
   // If the marketplace consistently blocks public fetches, stop. Don't keep
   // sending dozens of denied requests or attempt to bypass access controls.
   if(["marketplace_access_restricted","marketplace_redirected","public_metadata_unavailable"].includes(result.error||"")){
    limited++;
    if(limited>=2)break;
   }
   if(["product_api_not_connected","CHANNEL_NOT_AUTHORIZED","PAID_SUBSCRIPTION_REQUIRED","INVALID_API_KEY","QUOTA_EXCEEDED","RATE_LIMITED","RATE_LIMIT_EXCEEDED","PLATFORM_QUOTA_EXCEEDED","INSUFFICIENT_SCOPE"].includes(result.error||""))break;
   await new Promise<void>(resolve=>setTimeout(resolve,1200));
  }
  setRunning(false);
 }
 const href=(n:number)=>"/enrichment?collection="+collection+"&page="+n;
 return <div style={{maxWidth:1060,margin:"0 auto",padding:"35px 20px 80px",color:"#243c2b"}}>
  <p style={{fontWeight:800,letterSpacing:1.8,fontSize:12}}>HEROCON / OWNER CATALOGUE TOOLS</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,5vw,3.4rem)",fontWeight:400}}>Enrich products from their original links.</h1>
  <p style={{maxWidth:760,lineHeight:1.7}}>Both Herocon collections contain original marketplace links.
   The first direct-page test failed for 1688 and Weidian; their public HTML is not a reliable source
   of variants and prices. The structured HioBuy API can retrieve seller details, gallery images,
   option SKUs and CNY prices once an authorised API key is connected.</p>
  <nav style={{display:"flex",gap:14,flexWrap:"wrap",margin:"20px 0 25px"}}>
   <Link href="/enrichment?collection=business" style={{fontWeight:collection==="business"?800:400,color:"#20482f"}}>Start a Business</Link>
   <Link href="/enrichment?collection=personal" style={{fontWeight:collection==="personal"?800:400,color:"#20482f"}}>Shop for Yourself</Link>
  </nav>
  <p>Page {page} of {pageCount} · {total.toLocaleString("en-GB")} products in this collection</p>
  {!providerConnected?<section role="status" style={{
    border:"1px solid #d8c8a6",padding:18,background:"#f9f4e8",borderRadius:8,margin:"20px 0"
   }}>
    <strong>Structured product-data API not connected</strong>
    <p style={{fontSize:14,lineHeight:1.6}}>No HIOBUY_API_KEY is configured on the Herocon server.
     Because the 1688/Weidian page tests could not return usable data, further direct-page batches
     are paused. Existing catalogue images and prices are retained.</p>
    <p style={{fontSize:14,lineHeight:1.6}}>Create a developer account at
     {" "}<a href="https://developers.hiobuy.com" target="_blank" rel="noopener noreferrer"
     style={{color:"#20482f",textDecoration:"underline"}}>HioBuy Developer Portal</a>,
     generate an authorised product API key, then add it as a secure Production environment
     variable called <code>HIOBUY_API_KEY</code> in Vercel and redeploy Herocon.
     Never place the key in public source code.</p>
    <p style={{fontSize:12}}>HioBuy's published trial covers 1688 and Weidian for seven days;
     Taobao product reads require a paid subscription.</p>
   </section>:<p style={{fontSize:13,color:"#3d654b"}}>
    Product API key configured. Start with one page; API authorisation and quota are checked by the provider.
    Existing snapshots are skipped. This is not a full unattended catalogue import.
   </p>}
  <p style={{fontSize:13,color:"#6d7068"}}>
    Already saved in this page: <strong>{rows.filter(r=>r.saved).length}</strong>.
    Catalogue records with multiple images: <strong>{rows.filter(r=>r.existingImages>1).length}</strong>;
    recorded variants: <strong>{rows.filter(r=>r.existingVariants>0).length}</strong>;
    descriptions: <strong>{rows.filter(r=>r.hasDescription).length}</strong>.
    These existing fields are preserved even when live enrichment is unavailable.
   </p>
  <button onClick={()=>void run()} disabled={!providerConnected||running||rows.every(r=>r.saved)}
   style={{border:0,borderRadius:5,background:"#20482f",color:"white",padding:"13px 20px",
    fontWeight:800,opacity:!providerConnected||running||rows.every(r=>r.saved)?0.5:1,
    cursor:running?"wait":"pointer"}}>
   {running?"Enriching products…":!providerConnected?"Connect API to enrich": "Enrich this page ("+rows.filter(r=>!r.saved).length+" remaining)"}
  </button>
  <span aria-live="polite" style={{marginLeft:15,fontSize:13}}>
   {processed?"Checked "+processed+" product"+(processed===1?"":"s"):""}
  </span>
  <div style={{marginTop:20,display:"grid",gap:10}}>
   {rows.map(row=>{
    const result=results[row.id];
    const message=row.saved?"Previously enriched":
     result?.ok?"Saved · "+result.provider+" · "+(result.images||0)+" images · "+(result.variants||0)+" SKUs":
     result?.error?"Unavailable: "+result.error:"Not checked";
    return <article key={row.id} style={{border:"1px solid #d9ded3",borderRadius:8,background:"white",padding:"14px 16px"}}>
     <a href={row.productPath} style={{fontWeight:700,color:"#264a32"}}>{row.title.slice(0,120)}</a>
     <div style={{fontSize:12,marginTop:7,color:result?.error?"#9a332e":"#617263"}}>
      {message} · Existing photos: {row.existingImages} · Recorded options: {row.existingVariants}
      {row.hasDescription?" · Description saved":""}{row.hasSeller?" · Seller saved":""}
     </div>
    </article>;
   })}
  </div>
  <nav style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
   {page>1?<Link href={href(page-1)} style={{color:"#20482f"}}>Previous page</Link>:<span/>}
   {page<pageCount?<Link href={href(page+1)} style={{color:"#20482f"}}>Next page</Link>:<span/>}
  </nav>
 </div>;
}