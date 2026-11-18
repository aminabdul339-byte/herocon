"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";

type ImportState={
 catalogueProducts:number;
 permanentlySaved:number;
 attemptsToday:number;
 remainingDailyRequests:number;
 maxDailyNewLookups:number;
 categories:{name:string;missing:number}[];
 notice?:string;
 error?:string;
};
type ImportResult={
 attempted:number;
 saved:number;
 failed:number;
 remainingDailyRequests:number;
 stopReason:string|null;
 results:{category:string;id:string;result:string;code?:string;variantCount?:number}[];
 error?:string;
};
const PATH="/api/admin/catalogue/import-buckydrop";
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

export default function CatalogueImportPage(){
 const [key,setKey]=useState("");
 const [state,setState]=useState<ImportState|null>(null);
 const [message,setMessage]=useState("Enter your private catalogue-import key to load the current progress.");
 const [working,setWorking]=useState(false);
 const [loading,setLoading]=useState(false);
 const [runs,setRuns]=useState(0);
 const [savedThisRun,setSavedThisRun]=useState(0);
 const [failedThisRun,setFailedThisRun]=useState(0);
 const [history,setHistory]=useState<string[]>([]);
 const running=useRef(false);
 const alive=useRef(true);

 useEffect(()=>{alive.current=true;return ()=>{alive.current=false;running.current=false;};},[]);
 const auth=()=>({"x-herocon-catalogue-admin":key.trim()});
 async function fetchStatus(){
  if(!key.trim()){setMessage("Enter the private import key first.");return;}
  setLoading(true);
  try{
   const response=await fetch(PATH,{headers:auth(),cache:"no-store"});
   const d=await response.json() as ImportState;
   if(!response.ok)throw Error(d.error||"Cannot read importer status.");
   if(alive.current){setState(d);setMessage("Connected. Saved records are not fetched from BuckyDrop again.");}
  }catch(e){if(alive.current){setState(null);setMessage(e instanceof Error?e.message:"Unable to connect.");}}
  finally{if(alive.current)setLoading(false);}
 }
 function stop(){running.current=false;setMessage("Pausing after the current batch. One in-flight supplier request may still finish.");}
 async function start(){
  if(running.current||!state||!key.trim())return;
  running.current=true;
  setWorking(true);setRuns(0);setSavedThisRun(0);setFailedThisRun(0);setHistory([]);
  setMessage("Importing unsaved products from every category. Leave this tab open.");
  let batch=0,savedTotal=0,failedTotal=0;
  try{
   while(running.current&&alive.current){
    const response=await fetch(PATH,{
     method:"POST",
     headers:{...auth(),"Content-Type":"application/json"},
     body:JSON.stringify({max:3}),
     cache:"no-store"
    });
    const d=await response.json() as ImportResult;
    if(!response.ok||d.error)throw Error(d.error||"Import request failed.");
    batch++;
    savedTotal+=d.saved||0;
    failedTotal+=d.failed||0;
    if(!alive.current)break;
    setRuns(batch);setSavedThisRun(savedTotal);setFailedThisRun(failedTotal);
    const details=(d.results||[]).map(r=>r.category+": "+(r.result==="saved"?"saved "+(r.variantCount??0)+" variants":r.result==="already_saved"?"already saved":"failed ("+(r.code||"unknown")+")"));
    setHistory(previous=>[...details,...previous].slice(0,25));
    if(d.stopReason){
     setMessage(d.stopReason+" Import paused; no further requests were sent.");
     running.current=false;
     break;
    }
    if(d.remainingDailyRequests<=0){
     setMessage("Daily request backstop reached. The saved data remains permanent.");
     running.current=false;
     break;
    }
    if(!d.attempted){
     setMessage("All currently eligible unsaved catalogue products have been attempted.");
     running.current=false;
     break;
    }
    setMessage("Running: "+savedTotal+" newly saved, "+failedTotal+" failed in this session. Leave this tab open.");
    await sleep(1200);
   }
   if(alive.current&&running.current===false&&batch>0)setMessage(previous=>previous.startsWith("Pausing")?"Paused after "+batch+" batches; "+savedTotal+" products saved.":previous);
  }catch(e){
   if(alive.current)setMessage("Import stopped: "+(e instanceof Error?e.message:"Unexpected error"));
  }finally{
   running.current=false;
   if(alive.current){setWorking(false);try{
    const response=await fetch(PATH,{headers:auth(),cache:"no-store"});
    if(response.ok)setState(await response.json() as ImportState);
   }catch{}}
  }
 }
 const outstanding=state?Math.max(0,state.catalogueProducts-state.permanentlySaved):0;
 return <main style={{maxWidth:900,margin:"48px auto",padding:"0 22px",fontFamily:"system-ui, sans-serif",color:"#1a3023"}}>
  <p style={{fontSize:13,color:"#667e6d"}}><Link href="/">Herocon</Link> / Private operations</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(30px,5vw,48px)",margin:"12px 0"}}>Import all supplier products</h1>
  <p style={{color:"#506955",lineHeight:1.6}}>Only the merchant can start this operation. Once our sourcing partner returns a product successfully, Herocon stores that response permanently. Previously saved products are skipped. New partner lookups may be billable, with charges deducted the following day.</p>
  <section style={{padding:20,border:"1px solid #d6e3d8",borderRadius:12,marginTop:22}}>
   <label htmlFor="admin-key" style={{fontWeight:700,display:"block",marginBottom:8}}>Private catalogue import key</label>
   <input id="admin-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={e=>setKey(e.target.value)}
    placeholder="Paste the private key from your Mac" style={{width:"100%",boxSizing:"border-box",fontSize:14,border:"1px solid #b9cbbb",borderRadius:8,padding:"12px 14px"}}/>
   <p style={{fontSize:12,color:"#58705e",lineHeight:1.5}}>On your connected Mac, open Terminal and run <code>pbcopy &lt; ~/.config/herocon/catalogue-import-key</code>. Paste the copied key here. It stays in this page's memory, and is never saved in browser storage.</p>
   <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:18}}>
    <button type="button" disabled={loading||working||!key.trim()} onClick={fetchStatus} style={{background:"#e6efe7",color:"#1b4231",border:"none",borderRadius:8,padding:"12px 16px",fontWeight:750,cursor:"pointer"}}>{loading?"Checking…":"Check progress"}</button>
    <button type="button" disabled={working||!state} onClick={start} style={{background:"#214c35",color:"white",border:"none",borderRadius:8,padding:"12px 16px",fontWeight:750,cursor:"pointer",opacity:(working||!state)?0.7:1}}>Start importing all</button>
    <button type="button" disabled={!working} onClick={stop} style={{background:"#fff",color:"#74452b",border:"1px solid #c9b29b",borderRadius:8,padding:"12px 16px",fontWeight:750,cursor:"pointer",opacity:!working?0.5:1}}>Pause</button>
   </div>
  </section>
  <p role="status" aria-live="polite" style={{padding:"14px 0",minHeight:28,fontWeight:650}}>{message}</p>
  {state&&<section style={{border:"1px solid #d6e3d8",borderRadius:12,padding:20,marginTop:12}}>
   <h2 style={{fontSize:19}}>Catalogue progress</h2>
   <div style={{display:"flex",gap:22,flexWrap:"wrap",fontSize:15}}>
    <span><strong>{state.permanentlySaved.toLocaleString()}</strong> permanently saved</span>
    <span><strong>{outstanding.toLocaleString()}</strong> still missing</span>
    <span><strong>{state.catalogueProducts.toLocaleString()}</strong> in catalogue</span>
    <span><strong>{state.attemptsToday.toLocaleString()}</strong> attempted today</span>
   </div>
   <progress max={Math.max(1,state.catalogueProducts)} value={state.permanentlySaved} style={{display:"block",width:"100%",marginTop:16,height:16}}/>
   <p style={{fontSize:13,color:"#667e6d"}}>In this run: {runs} batches, {savedThisRun} new saves, {failedThisRun} failed. Request backstop: {state.maxDailyNewLookups} per UTC day, not a monetary limit.</p>
   <h3 style={{marginTop:24}}>Products remaining by category</h3>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:8}}>
    {state.categories.map(c=><div key={c.name} style={{padding:"8px 10px",background:"#f5f9f3",borderRadius:5,fontSize:13}}>{c.name}: <strong>{c.missing}</strong></div>)}
   </div>
  </section>}
  {history.length>0&&<section style={{marginTop:24}}><h2 style={{fontSize:19}}>Recent import results</h2><ul>{history.map((item,index)=><li key={index} style={{padding:"4px 0",fontSize:13}}>{item}</li>)}</ul></section>}
  <p style={{fontSize:12,color:"#667e6d",margin:"28px 0 55px",lineHeight:1.6}}>Keep this tab open while importing. Closing or reloading it stops the client-side loop. Our partner's own rate limits, authorisations and account-balance restrictions are honoured. Partner API charges, Vercel storage charges and any associated network costs are separate.</p>
 </main>;
}
