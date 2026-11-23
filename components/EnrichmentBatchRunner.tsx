"use client";
import {useState} from "react";
import Link from "next/link";

type Row={id:string;title:string;sourceUrl:string;saved:boolean;productPath:string;existingImages:number;existingVariants:number;hasDescription:boolean;hasSeller:boolean};
type Result={ok?:boolean;error?:string;provider?:string;images?:number;variants?:number;descriptionFound?:boolean};
type Channel="1688"|"taobao"|"weidian"|"other";
type BlockedChannels=Partial<Record<Channel,string>>;
const BLOCKED_KEY="herocon-enrichment-blocked-channels-v1";
const BLOCKED_TTL=24*60*60*1000;
function marketplace(sourceUrl:string):Channel{
 try{
  const host=new URL(sourceUrl).hostname.toLowerCase();
  if(host==="detail.1688.com")return "1688";
  if(host==="item.taobao.com"||host==="detail.tmall.com")return "taobao";
  if(host==="weidian.com"||host==="www.weidian.com")return "weidian";
 }catch{}
 return "other";
}
function loadBlocked():BlockedChannels{
 try{
  const raw=sessionStorage.getItem(BLOCKED_KEY);
  if(!raw)return {};
  const parsed=JSON.parse(raw) as {date?:number;channels?:BlockedChannels};
  if(typeof parsed.date!=="number"||Date.now()-parsed.date>BLOCKED_TTL)return {};
  return parsed.channels||{};
 }catch{return {};}
}
function saveBlocked(channels:BlockedChannels){
 try{sessionStorage.setItem(BLOCKED_KEY,JSON.stringify({date:Date.now(),channels}));}catch{}
}
function niceReason(code:string){
 const labels:Record<string,string>={
  PAID_SUBSCRIPTION_REQUIRED:"Paid marketplace subscription required",
  CHANNEL_NOT_AUTHORIZED:"Marketplace channel not authorised",
  QUOTA_EXCEEDED:"API quota exhausted",
  PLATFORM_QUOTA_EXCEEDED:"Platform API quota exhausted",
  RATE_LIMITED:"API rate limit reached",
  RATE_LIMIT_EXCEEDED:"API rate limit reached",
  INVALID_API_KEY:"Provider API key rejected",
  INSUFFICIENT_SCOPE:"Insufficient API permission",
  network_error:"Network error"
 };
 return labels[code]||code.replaceAll("_"," ").toLowerCase();
}

export default function EnrichmentBatchRunner({
 collection,rows,page,total,providerConnected
}:{collection:"business"|"personal";rows:Row[];page:number;total:number;providerConnected:boolean}){
 const [running,setRunning]=useState(false);
 const [results,setResults]=useState<Record<string,Result>>({});
 const [processed,setProcessed]=useState(0);
 const [runSummary,setRunSummary]=useState("");
 const [blocked,setBlocked]=useState<BlockedChannels>({});
 const [wasChecked,setWasChecked]=useState(false);
 const pageCount=Math.ceil(total/12);
 async function run(){
  if(running||!providerConnected)return;
  setRunning(true);setProcessed(0);setResults({});setRunSummary("");
  let saved=0, skipped=0, failed=0, checked=0;
  let stopReason="";
  // A subscription/auth failure is restricted to its actual marketplace.
  // Cache the restriction only in this browser session, to avoid wasting
  // per-product quota on the same inaccessible channel on later pages.
  const channelBlocks=loadBlocked();
  setBlocked({...channelBlocks});setWasChecked(true);
  const nextResults:Record<string,Result>={};
  try{
   for(const row of rows){
    if(row.saved){
     nextResults[row.id]={ok:true,provider:"Saved earlier"};
     setResults({...nextResults});
     continue;
    }
    const channel=marketplace(row.sourceUrl);
    if(channelBlocks[channel]){
     skipped++;
     nextResults[row.id]={ok:false,error:"skipped_"+channelBlocks[channel]};
     setResults({...nextResults});
     continue;
    }
    let result:Result;
    try{
     const res=await fetch("/api/marketplace-enrichment",{
      method:"POST",headers:{"Content-Type":"application/json"},
      credentials:"same-origin",cache:"no-store",
      body:JSON.stringify({productId:row.id,collection})
     });
     result=await res.json() as Result;
     if(!res.ok&&result.ok)result={ok:false,error:"provider_error"};
    }catch{result={ok:false,error:"network_error"};}
    nextResults[row.id]=result;
    setResults({...nextResults});
    checked++;
    setProcessed(checked);
    if(result.ok)saved++;else failed++;

    // Only this channel needs a paid plan / channel authorisation.
    if(channel!=="other"&&["PAID_SUBSCRIPTION_REQUIRED","CHANNEL_NOT_AUTHORIZED"].includes(result.error||"")){
     channelBlocks[channel]=result.error;
     saveBlocked(channelBlocks);
     setBlocked({...channelBlocks});
     continue;
    }

    // Shared quotas, invalid account credentials, and provider rate limits
    // affect all channels, so stop safely and show the explicit reason.
    if(["product_api_not_connected","INVALID_API_KEY","INSUFFICIENT_SCOPE",
        "QUOTA_EXCEEDED","PLATFORM_QUOTA_EXCEEDED","RATE_LIMITED","RATE_LIMIT_EXCEEDED",
        "hiobuy_rate_limited"].includes(result.error||"")){
     stopReason=niceReason(result.error||"provider_error");
     break;
    }
    // Do not repeatedly hammer the same provider after transient outages.
    if(["hiobuy_unavailable","network_error"].includes(result.error||"")&&failed>=3){
     stopReason="Repeated provider/network failures";
     break;
    }
    await new Promise<void>(resolve=>setTimeout(resolve,1200));
   }
  }finally{
   setRunning(false);
   setRunSummary(
    "Finished: "+saved+" newly enriched, "+skipped+" skipped because of marketplace access, "+
    failed+" failed, "+checked+" API checks."+
    (stopReason?" Stopped: "+stopReason+".":"")
   );
  }
 }
 function clearBlocked(){
  try{sessionStorage.removeItem(BLOCKED_KEY);}catch{}
  setBlocked({});setWasChecked(false);setRunSummary("Marketplace restrictions reset. Only retry if access has been updated.");
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
    Existing snapshots are skipped. Paid or unauthorised marketplace channels are skipped
    without stopping other supported channels; full API quota exhaustion still pauses the run.
    This is not a full unattended catalogue import.
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
  {runSummary&&<p role="status" style={{fontSize:14,lineHeight:1.6,fontWeight:650,marginTop:16}}>
    {runSummary}
   </p>}
  {wasChecked&&Object.keys(blocked).length>0&&<p style={{fontSize:13,lineHeight:1.6,color:"#79522b",marginTop:10}}>
    Skipping restricted marketplace channels this session: {Object.entries(blocked).map(([name,code])=>name+" ("+niceReason(code||"")+")").join(", ")}.
    {" "}<button type="button" onClick={clearBlocked} style={{
     background:"none",border:0,padding:0,textDecoration:"underline",
     cursor:"pointer",color:"#20482f",fontWeight:700
    }}>Retry restricted marketplaces</button>
   </p>}
  <div style={{marginTop:20,display:"grid",gap:10}}>
   {rows.map(row=>{
    const result=results[row.id];
    const message=row.saved?"Previously enriched":
     result?.ok?"Saved · "+result.provider+" · "+(result.images||0)+" images · "+(result.variants||0)+" SKUs":
     result?.error?.startsWith("skipped_")?"Skipped: "+niceReason(result.error.slice(8))+" ("+marketplace(row.sourceUrl)+")":
     result?.error?"Unavailable: "+niceReason(result.error)+" ("+marketplace(row.sourceUrl)+")":"Not checked";
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