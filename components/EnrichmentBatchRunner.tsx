import Link from "next/link";
import EnrichmentAutoRefresh from "@/components/EnrichmentAutoRefresh";
import type {BuckydropBulkStatus} from "@/lib/buckydrop-bulk";

type Row={id:string;title:string;sourceUrl:string;saved:boolean;productPath:string;
 existingImages:number;existingVariants:number;hasDescription:boolean;hasSeller:boolean};
export default function EnrichmentBatchRunner({
 collection,rows,page,total,providerConnected,automationConfigured,progress,uniqueSources,savedUnique
}:{
 collection:"business"|"personal";rows:Row[];page:number;total:number;
 providerConnected:boolean;automationConfigured:boolean;
 progress:BuckydropBulkStatus;uniqueSources:number;savedUnique:number
}){
 const pageCount=Math.max(1,Math.ceil(total/12));
 const href=(n:number)=>"/enrichment?collection="+collection+"&page="+n;
 const pct=uniqueSources>0?Math.min(100,Math.floor(100*savedUnique/uniqueSources)):0;
 const nextScheduled=progress.nextScheduledAt?new Date(progress.nextScheduledAt).toLocaleString("en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"
 }):null;
 const lastRun=progress.lastRun?new Date(progress.lastRun).toLocaleString("en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"
 }):null;
 return <div style={{maxWidth:1080,margin:"0 auto",padding:"35px 20px 80px",color:"#243c2b"}}>
  <p style={{fontWeight:800,letterSpacing:1.8,fontSize:12}}>HEROCON / AUTOMATIC CATALOGUE ENRICHMENT</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,5vw,3.4rem)",fontWeight:400}}>
   Complete supplier details, without repeat charges.
  </h1>
  <p style={{maxWidth:780,lineHeight:1.7}}>
   Herocon now uses BuckyDrop to fill gaps in the Start a Business and Shop for Yourself
   catalogues. Every supplier URL is normalised and de-duplicated across collections.
   Existing HioBuy and BuckyDrop records are skipped before any paid supplier lookup.
   Saved full variant lists, gallery images, descriptions, seller and price details
   are displayed on the product pages. No manual page-by-page work is required.
  </p>
  <section style={{border:"1px solid #d4ded3",background:"#f3f7f0",
   borderRadius:10,padding:22,margin:"22px 0 24px"}}>
   <p style={{fontSize:12,letterSpacing:1.3,fontWeight:800,margin:"0 0 8px"}}>
    {providerConnected&&automationConfigured?"BUCKYDROP BATCH SCHEDULE CONFIGURED":"AUTOMATIC PROCESSING NEEDS ATTENTION"}
   </p>
   <p style={{margin:"0 0 13px",fontSize:14,lineHeight:1.6}}>
    {providerConnected&&automationConfigured
     ?"The automatic job has 24 scheduled batches. They run independently and skip all supplier links with existing snapshots. Vercel controls the exact start time; an older paused batch does not stop future scheduled batches."
     :"BuckyDrop's live API, private storage, or secure Cron authentication is not configured; no paid batch calls can run."}
   </p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:15,marginBottom:16}}>
    <div><strong style={{fontSize:28}}>{savedUnique.toLocaleString("en-GB")}</strong>
     <div style={{fontSize:12}}>Supplier links with saved details</div></div>
    <div><strong style={{fontSize:28}}>{uniqueSources.toLocaleString("en-GB")}</strong>
     <div style={{fontSize:12}}>Distinct supplier URLs in both catalogues</div></div>
    <div><strong style={{fontSize:28}}>{pct}%</strong>
     <div style={{fontSize:12}}>Overall enrichment coverage</div></div>
   </div>
   <div role="progressbar" aria-label="Supplier enrichment coverage"
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
    style={{height:9,background:"#d4ded1",borderRadius:20,overflow:"hidden"}}>
    <div style={{height:"100%",width:pct+"%",background:"#3e7251"}}/>
   </div>
   {nextScheduled&&<p role="status" style={{fontSize:14,lineHeight:1.65,margin:"15px 0 0",fontWeight:700}}>
    Next scheduled batch: {nextScheduled} (UTC/London) · Shard {progress.nextScheduledShard}.
    {progress.cooldownUntil?" The supplier cooldown must expire before requests resume.":" No active provider cooldown is recorded."}
   </p>}
   <p style={{fontSize:13,lineHeight:1.7,margin:"15px 0 0"}}>
    Provider breakdown: <strong>{progress.buckydropSaved.toLocaleString("en-GB")}</strong> saved BuckyDrop sources
    {" · "}<strong>{progress.hioBuySaved.toLocaleString("en-GB")}</strong> saved HioBuy sources
    {" · "}<strong>{progress.sharedSaved.toLocaleString("en-GB")}</strong> appear in both.
    These are existing saved supplier snapshots, not the count of new paid requests.
   </p>
   <p style={{fontSize:13,lineHeight:1.7,margin:"10px 0 0"}}>
    {lastRun?"Latest BuckyDrop batch started "+lastRun+".":"No BuckyDrop batch has executed yet."}
    {lastRun?" Latest per-shard status totals: "+progress.checked+
      " supplier checks, "+progress.saved+" new saved records, "+
      progress.unavailable+" unavailable and "+progress.failed+" failures.":""}
   </p>
   <p style={{fontSize:13,lineHeight:1.7,margin:"8px 0 0"}}>
    <strong>{progress.pending.toLocaleString("en-GB")}</strong> supplier URLs still lack saved details.
    {progress.activeShards>0?" "+progress.activeShards+" batch(es) currently reporting as active.":""}
    {progress.pausedShards>0?" "+progress.pausedShards+" earlier batch(es) ended paused or failed (historical).":""}
   </p>
   <p style={{fontSize:13,lineHeight:1.7,margin:"8px 0 0"}}>Of the missing sources: <strong>{progress.permanentlyUnavailable}</strong> marked unavailable by the provider, <strong>{progress.attemptedToday}</strong> already attempted today without a saved record, and <strong>{progress.eligibleNow}</strong> eligible for a new lookup today (subject to provider cooldowns). Existing snapshots are skipped. HioBuy may independently check sources that BuckyDrop could not retrieve.</p>
   {progress.cooldownUntil&&<p role="status" style={{fontSize:13,color:"#8a5223",fontWeight:650}}>
    Supplier cooldown: {progress.cooldownReason}. API calls are paused until
    {" "}{new Date(progress.cooldownUntil).toLocaleString("en-GB",{
     dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"
    })}. Scheduled batches automatically respect this limit; topping up credit does not remove a provider rate limit.
   </p>}
   {progress.lastIssue&&<p style={{fontSize:13,color:"#8a5223"}}>
    Historical issue from a previous batch: <strong>{progress.lastIssue}</strong>. This is not proof the next batch is blocked. Saved records remain preserved.
   </p>}
   <p style={{fontSize:13,lineHeight:1.7,margin:"8px 0 0"}}>A one-time HioBuy fallback is configured for 24 November (up to 27 lookups, subject to remaining quota and channel access). BuckyDrop recovery is configured for 25 November at 00:10 UTC, with existing daily attempt and cooldown protections.</p>
   <EnrichmentAutoRefresh/>
   <p style={{fontSize:12,color:"#6c7268",lineHeight:1.6,margin:"10px 0 0"}}>
    Following BuckyDrop's rate-limit response to the initial four concurrent lookups,
    batches now send only one product lookup at a time, spaced by at least 7.5 seconds.
    Additional throttling errors extend the cooldown instead of forcing more requests.
    Each supplier link is attempted no more than once per batch day, and
    existing records across either source are never intentionally recharged.
    Some listings may be unavailable or unsupported by BuckyDrop.
    Prices and stock are snapshots, not checkout guarantees.
   </p>
  </section>
  <nav style={{display:"flex",gap:18,flexWrap:"wrap",margin:"20px 0 25px"}}>
   <Link href="/enrichment?collection=business" style={{fontWeight:collection==="business"?800:400,color:"#20482f"}}>Start a Business</Link>
   <Link href="/enrichment?collection=personal" style={{fontWeight:collection==="personal"?800:400,color:"#20482f"}}>Shop for Yourself</Link>
  </nav>
  <p style={{marginBottom:8}}>Page {page} of {pageCount} · {total.toLocaleString("en-GB")} listings</p>
  <p style={{fontSize:13,color:"#6d7068",lineHeight:1.6}}>
   Saved supplier records on this page: <strong>{rows.filter(r=>r.saved).length}</strong>.
   The photo and option counts below are taken from saved supplier snapshots where available, rather than just the original import.
  </p>
  <div style={{marginTop:20,display:"grid",gap:10}}>
   {rows.map(row=><article key={row.id} style={{
      border:"1px solid #d9ded3",borderRadius:8,background:"white",padding:"14px 16px"
     }}>
     <Link href={row.productPath} style={{fontWeight:700,color:"#264a32"}}>{row.title.slice(0,120)}</Link>
     <div style={{fontSize:12,marginTop:7,color:row.saved?"#275839":"#617263"}}>
      {row.saved?"Supplier details saved":"Not yet enriched / supplier lookup pending"}
      {" · "}{row.saved?"Supplier photos recorded: ":"Catalogue photos: "}{row.existingImages}
      {" · "}Saved or imported options: {row.existingVariants}
      {row.hasDescription?" · Description recorded":""}
     </div>
    </article>)}
  </div>
  <nav style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
   {page>1?<Link href={href(page-1)} style={{color:"#20482f"}}>Previous page</Link>:<span/>}
   {page<pageCount?<Link href={href(page+1)} style={{color:"#20482f"}}>Next page</Link>:<span/>}
  </nav>
 </div>;
}
