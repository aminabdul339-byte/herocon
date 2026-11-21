"use client";

import {useState} from "react";
import Link from "next/link";
type Scope="women"|"men"|"all";
type Status={
 total:number;saved:number;attemptedInScope:number;
 attemptsToday:number;eligible:number;remainingDaily:number;
 blockedReason:string|null;apiReady:boolean;dailyMaximum:number;
 categories:{name:string;total:number;saved:number;eligible:number}[];
 notice:string;error?:string
};
type Run={
 attempted:number;saved:number;existing:number;failed:number;
 remainingDaily:number;stopReason:string|null;
 results:{id:string;category:string;status:string;options?:number;code?:string}[];
 error?:string
};
const API="/api/admin/shop-personal-enrichment";
const box={border:"1px solid #d7e2d5",background:"white",padding:23,borderRadius:8};
const button={background:"#284b35",border:0,borderRadius:5,color:"white",padding:"12px 18px",fontSize:13,fontWeight:700 as const,cursor:"pointer"};
export default function PrivatePersonalEnrichmentPage(){
 const [key,setKey]=useState("");
 const [scope,setScope]=useState<Scope>("women");
 const [status,setStatus]=useState<Status|null>(null);
 const [busy,setBusy]=useState(false);
 const [accepted,setAccepted]=useState(false);
 const [amount,setAmount]=useState(1);
 const [message,setMessage]=useState("");
 const [history,setHistory]=useState<Run|null>(null);
 const auth=()=>({"x-herocon-catalogue-admin":key});
 async function inspect(selected:Scope=scope){
  if(!key||busy)return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch(API+"?scope="+selected,{headers:auth(),cache:"no-store"});
   const data=await response.json() as Status;
   if(!response.ok)throw Error(data.error||"Unable to read current import status");
   setStatus(data);
  }catch(err){setStatus(null);setMessage(err instanceof Error?err.message:"Unable to inspect catalogue");}
  finally{setBusy(false);}
 }
 async function importBatch(){
  if(!key||!accepted||busy||!status?.apiReady||status.blockedReason||status.remainingDaily<1)return;
  setBusy(true);setMessage("");setHistory(null);
  try{
   const response=await fetch(API,{
    method:"POST",cache:"no-store",
    headers:{...auth(),"Content-Type":"application/json"},
    body:JSON.stringify({scope,max:amount,acceptBillable:true})
   });
   const run=await response.json() as Run;
   if(!response.ok)throw Error(run.error||"Supplier import could not start");
   setHistory(run);
   setMessage(run.stopReason||"Import complete. New details are stored permanently and will appear on linked product pages.");
  }catch(err){setMessage(err instanceof Error?err.message:"Import unsuccessful");}
  finally{setBusy(false);}
 }
 async function refresh(){await inspect();}
 return <main style={{background:"#f6f8f3",minHeight:"100vh",padding:"35px 20px 90px",fontFamily:"Arial,Helvetica,sans-serif",color:"#294233"}}>
  <div style={{maxWidth:930,margin:"0 auto"}}>
   <Link href="/" style={{fontSize:12,color:"#54745a",fontWeight:700,textDecoration:"none"}}>HEROCON / PRIVATE OPERATIONS</Link>
   <h1 style={{font:"400 clamp(32px,5vw,49px)/1.08 Georgia,serif",letterSpacing:"-.035em",margin:"25px 0 10px"}}>Enrich the <em>Personal Edit.</em></h1>
   <p style={{fontSize:14,color:"#637969",lineHeight:1.75,maxWidth:720}}>
    Reuse saved supplier data to add real seller information, photographs, colour and size choices, SKU prices and descriptions.
    New supplier lookups may be billable and happen only when you explicitly start a small batch.
   </p>
   <section style={{...box,margin:"25px 0 16px"}}>
    <label style={{fontWeight:700,fontSize:13,display:"block"}}>Private Herocon catalogue-import key
     <input value={key} onChange={e=>{setKey(e.target.value);setStatus(null);}} type="password" autoComplete="off" spellCheck={false}
      style={{display:"block",margin:"8px 0 17px",width:"100%",boxSizing:"border-box",padding:13,border:"1px solid #b8ccb9",borderRadius:5,fontSize:14}}/>
    </label>
    <label style={{fontWeight:700,fontSize:13}}>Collection to inspect
     <select value={scope} disabled={busy} onChange={e=>{setScope(e.target.value as Scope);setStatus(null);setHistory(null);}}
      style={{display:"block",margin:"8px 0 17px",padding:12,border:"1px solid #b8ccb9",borderRadius:5,width:"100%",fontSize:14}}>
      <option value="women">Women's collection</option><option value="men">Men's collection</option><option value="all">Both collections (deduplicated)</option>
     </select>
    </label>
    <button type="button" style={button} disabled={!key||busy} onClick={()=>inspect()}>{busy?"Checking…":"Check saved supplier details"}</button>
   </section>
   {message&&<p role="status" style={{fontSize:13,lineHeight:1.7,color:"#526b58"}}>{message}</p>}
   {status&&<>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:11,margin:"16px 0"}}>
     {([["Shop listings",status.total],["Already enriched",status.saved],["Still eligible",status.eligible],
      ["Attempts today",status.attemptsToday],["Daily calls remaining",status.remainingDaily]] as const).map(([name,count])=>
      <div key={name} style={{...box,padding:16}}><span style={{fontSize:11,color:"#607d65"}}>{name}</span>
       <div style={{font:"400 31px Georgia,serif",marginTop:8}}>{count.toLocaleString()}</div>
      </div>)}
    </section>
    <section style={box}>
     <h2 style={{font:"400 27px Georgia,serif",margin:"0 0 10px"}}>Request missing product details</h2>
     <p style={{fontSize:13,color:"#657c68",lineHeight:1.7}}>
      Saving an existing snapshot incurs no new supplier lookup fee. For unsaved listings, each new API lookup may be charged by the provider.
      This tool has a strict limit of {status.dailyMaximum} attempts per UTC day and never retries automatically.
     </p>
     {status.blockedReason&&<p role="alert" style={{fontSize:13,color:"#a34135"}}>Supplier imports are paused: {status.blockedReason}. No new paid requests can be sent today.</p>}
     {!status.apiReady&&<p role="alert" style={{fontSize:13,color:"#a34135"}}>Live supplier lookups are not configured in production. Saved product records can still appear without new requests.</p>}
     <label style={{display:"block",fontWeight:700,fontSize:13,marginTop:15}}>Products in this batch
      <select value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{display:"block",marginTop:8,padding:11,border:"1px solid #b8ccb9",borderRadius:5}}>
       <option value={1}>1 product</option><option value={2}>2 products</option><option value={3}>3 products</option>
      </select>
     </label>
     <label style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:13,lineHeight:1.65,margin:"19px 0"}}>
      <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} style={{marginTop:4}}/>
      I understand new supplier product lookups can be billable, and I approve this batch of up to {amount} product{amount!==1?"s":""}.
     </label>
     <button type="button" style={{...button,opacity:busy||!accepted||!status.apiReady||status.blockedReason||!status.eligible||!status.remainingDaily?0.45:1}}
      disabled={busy||!accepted||!status.apiReady||Boolean(status.blockedReason)||!status.eligible||!status.remainingDaily}
      onClick={importBatch}>{busy?"Processing…":"Enrich next "+amount+" product"+(amount===1?"":"s")}</button>
     <button type="button" disabled={busy} onClick={refresh} style={{marginLeft:9,padding:"11px 15px",background:"transparent",border:"1px solid #bed0bf",borderRadius:5,color:"#36583d",fontSize:13,cursor:"pointer"}}>Refresh totals</button>
     {history&&<div style={{marginTop:17,padding:15,background:"#f4f7f2",fontSize:13,lineHeight:1.7}}>
      <strong>{history.saved} new saved · {history.existing} reused · {history.failed} failed</strong>
      {(history.results||[]).map((result,i)=><div key={i}>{result.category}: {result.status}{result.options!==undefined?" · "+result.options+" options":""}{result.code?" · "+result.code:""}</div>)}
     </div>}
    </section>
    <section style={{...box,marginTop:16}}>
     <h2 style={{font:"400 25px Georgia,serif",margin:"0 0 13px"}}>Category coverage</h2>
     {(status.categories||[]).map(c=><div key={c.name} style={{display:"flex",gap:12,justifyContent:"space-between",padding:"11px 0",borderTop:"1px solid #edf0e9",fontSize:13}}>
      <span>{c.name}</span><span>{c.saved} enriched / {c.total} listings</span>
     </div>)}
    </section>
    <p style={{fontSize:12,color:"#6b806f",lineHeight:1.8,marginTop:20}}>
     A saved product may still have missing images or SKU options if the supplier did not provide them. Prices and availability may change. This tool never creates orders or payments.
    </p>
   </>}
   <p style={{fontSize:13,marginTop:24}}><Link href="/shop-for-yourself" style={{color:"#42684b"}}>View Shop for Yourself</Link></p>
  </div>
 </main>;
}
