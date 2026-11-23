"use client";
import {useState} from "react";
import Link from "next/link";

type Row={id:string;title:string;sourceUrl:string;saved:boolean;productPath:string};
type Result={ok?:boolean;error?:string;provider?:string;images?:number;variants?:number;descriptionFound?:boolean};
export default function EnrichmentBatchRunner({
 collection,rows,page,total
}:{collection:"business"|"personal";rows:Row[];page:number;total:number}){
 const [running,setRunning]=useState(false);
 const [results,setResults]=useState<Record<string,Result>>({});
 const [processed,setProcessed]=useState(0);
 const pageCount=Math.ceil(total/12);
 async function run(){
  if(running)return;
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
   if(["CHANNEL_NOT_AUTHORIZED","PAID_SUBSCRIPTION_REQUIRED","INVALID_API_KEY","QUOTA_EXCEEDED","RATE_LIMITED"].includes(result.error||""))break;
   await new Promise<void>(resolve=>setTimeout(resolve,1200));
  }
  setRunning(false);
 }
 const href=(n:number)=>"/enrichment?collection="+collection+"&page="+n;
 return <div style={{maxWidth:1060,margin:"0 auto",padding:"35px 20px 80px",color:"#243c2b"}}>
  <p style={{fontWeight:800,letterSpacing:1.8,fontSize:12}}>HEROCON / OWNER CATALOGUE TOOLS</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,5vw,3.4rem)",fontWeight:400}}>Enrich products from their original links.</h1>
  <p style={{maxWidth:760,lineHeight:1.7}}>Products in both collections already have supplier links. This pilot checks those
   original pages for accessible metadata, then saves real details to the matching Herocon product.
   The optional HioBuy product-data API provides fuller SKU, stock and gallery information after connection.
   Restricted supplier pages are not bypassed.</p>
  <nav style={{display:"flex",gap:14,flexWrap:"wrap",margin:"20px 0 25px"}}>
   <Link href="/enrichment?collection=business" style={{fontWeight:collection==="business"?800:400,color:"#20482f"}}>Start a Business</Link>
   <Link href="/enrichment?collection=personal" style={{fontWeight:collection==="personal"?800:400,color:"#20482f"}}>Shop for Yourself</Link>
  </nav>
  <p>Page {page} of {pageCount} · {total.toLocaleString("en-GB")} products in this collection</p>
  <p style={{fontSize:13,color:"#7e5330"}}>This is an owner-only pilot, not a bulk bypass of marketplace restrictions.
   The check stops when a provider blocks repeated reads or the API quota is exhausted.</p>
  <button onClick={()=>void run()} disabled={running||rows.every(r=>r.saved)}
   style={{border:0,borderRadius:5,background:"#20482f",color:"white",padding:"13px 20px",
    fontWeight:800,opacity:running||rows.every(r=>r.saved)?0.5:1,cursor:running?"wait":"pointer"}}>
   {running?"Enriching products…":"Enrich this page ("+rows.filter(r=>!r.saved).length+" remaining)"}
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
      {message}
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