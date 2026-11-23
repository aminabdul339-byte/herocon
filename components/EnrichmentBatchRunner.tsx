import Link from "next/link";
import type {AutomaticEnrichmentState} from "@/lib/automatic-enrichment";

type Row={id:string;title:string;sourceUrl:string;saved:boolean;productPath:string;
 existingImages:number;existingVariants:number;hasDescription:boolean;hasSeller:boolean};
export default function EnrichmentBatchRunner({
 collection,rows,page,total,providerConnected,automationConfigured,progress,uniqueSources,savedUnique
}:{
 collection:"business"|"personal";rows:Row[];page:number;total:number;
 providerConnected:boolean;automationConfigured:boolean;
 progress:AutomaticEnrichmentState;uniqueSources:number;savedUnique:number
}){
 const pageCount=Math.max(1,Math.ceil(total/12));
 const href=(n:number)=>"/enrichment?collection="+collection+"&page="+n;
 const pct=uniqueSources>0?Math.min(100,Math.round(savedUnique/uniqueSources*100)):0;
 const lastRun=progress.lastRun?new Date(progress.lastRun).toLocaleString("en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"
 }):null;
 const activeBlocks=Object.entries(progress.blockedChannels).filter(([,x])=>x&&x.until>Date.now());
 return <div style={{maxWidth:1080,margin:"0 auto",padding:"35px 20px 80px",color:"#243c2b"}}>
  <p style={{fontWeight:800,letterSpacing:1.8,fontSize:12}}>HEROCON / AUTOMATIC CATALOGUE ENRICHMENT</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,5vw,3.4rem)",fontWeight:400}}>
   Product details, updated automatically.
  </h1>
  <p style={{maxWidth:780,lineHeight:1.7}}>
   Herocon now reads the verified marketplace links from both catalogues on a daily,
   unattended schedule. It saves real supplier photographs, SKU options, descriptions
   and CNY price snapshots, then displays them on product pages. Already saved
   links are skipped, and restricted marketplace channels are excluded.
  </p>
  <section style={{border:"1px solid #d4ded3",background:"#f3f7f0",
   borderRadius:10,padding:22,margin:"22px 0 24px"}}>
   <p style={{fontSize:12,letterSpacing:1.3,fontWeight:800,margin:"0 0 8px"}}>
    {providerConnected&&automationConfigured?"AUTOMATIC DAILY ENRICHMENT CONFIGURED":"SETUP INCOMPLETE"}
   </p>
   <p style={{margin:"0 0 13px",fontSize:14,lineHeight:1.6}}>
    {providerConnected&&automationConfigured
     ?"The scheduled runner checks supplier data daily at approximately 05:15 UTC. No button clicks are required."
     :"A provider API key, secure cron secret or private storage setting is missing. Scheduled enrichment cannot run until all are connected."}
   </p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:15,marginBottom:16}}>
    <div><strong style={{fontSize:28}}>{savedUnique.toLocaleString("en-GB")}</strong>
     <div style={{fontSize:12}}>Unique source links enriched</div></div>
    <div><strong style={{fontSize:28}}>{uniqueSources.toLocaleString("en-GB")}</strong>
     <div style={{fontSize:12}}>Unique source links in both catalogues</div></div>
    <div><strong style={{fontSize:28}}>{pct}%</strong>
     <div style={{fontSize:12}}>Source-link coverage so far</div></div>
   </div>
   <div role="progressbar" aria-label="Product enrichment coverage" aria-valuemin={0}
    aria-valuemax={100} aria-valuenow={pct}
    style={{height:9,background:"#d4ded1",borderRadius:20,overflow:"hidden"}}>
    <div style={{height:"100%",width:pct+"%",background:"#3e7251"}}/>
   </div>
   <p style={{fontSize:13,lineHeight:1.6,margin:"15px 0 0"}}>
    {lastRun?"Most recent scheduled run: "+lastRun+".":"No scheduled run has been recorded yet."}
    {lastRun?" Checked "+progress.lastRunRequests+" products, saved "+progress.lastRunSaved+
      ", skipped "+progress.lastRunSkipped+", failed "+progress.lastRunErrors+".":""}
   </p>
   {progress.lastIssue&&<p style={{fontSize:13,color:"#89602e"}}>
    Last provider issue: <strong>{progress.lastIssue}</strong>. The existing results remain saved.
   </p>}
   {activeBlocks.length>0&&<p style={{fontSize:13,color:"#89602e"}}>
    Temporarily restricted channels: {activeBlocks.map(([channel])=>channel).join(", ")}.
   </p>}
   <p style={{fontSize:12,color:"#6c7268",lineHeight:1.6,margin:"10px 0 0"}}>
    The runner is limited to 36 supplier checks per day to protect API quota.
    Taobao is excluded until separately authorised. The HioBuy trial or quota may
    limit how many products can be enriched without a paid plan.
    Photos, variants and prices are dated supplier data, not guaranteed current inventory.
   </p>
  </section>
  <nav style={{display:"flex",gap:18,flexWrap:"wrap",margin:"20px 0 25px"}}>
   <Link href="/enrichment?collection=business"
    style={{fontWeight:collection==="business"?800:400,color:"#20482f"}}>Start a Business</Link>
   <Link href="/enrichment?collection=personal"
    style={{fontWeight:collection==="personal"?800:400,color:"#20482f"}}>Shop for Yourself</Link>
  </nav>
  <p style={{marginBottom:8}}>Page {page} of {pageCount} · {total.toLocaleString("en-GB")} products in this collection</p>
  <p style={{fontSize:13,color:"#6d7068",lineHeight:1.6}}>
    Enriched sources on this page: <strong>{rows.filter(r=>r.saved).length}</strong>.
    Other imported product data is preserved while the automatic queue works.
    Products below link directly to their updated details.
  </p>
  <div style={{marginTop:20,display:"grid",gap:10}}>
   {rows.map(row=><article key={row.id} style={{
      border:"1px solid #d9ded3",borderRadius:8,background:"white",padding:"14px 16px"
     }}>
     <Link href={row.productPath} style={{fontWeight:700,color:"#264a32"}}>{row.title.slice(0,120)}</Link>
     <div style={{fontSize:12,marginTop:7,color:row.saved?"#275839":"#617263"}}>
      {row.saved?"Supplier enrichment saved":"Waiting for automatic enrichment"}
      {" · "}Already recorded photos: {row.existingImages}
      {" · "}Existing options: {row.existingVariants}
      {row.hasDescription?" · Description saved":""}
     </div>
    </article>)}
  </div>
  <nav style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
   {page>1?<Link href={href(page-1)} style={{color:"#20482f"}}>Previous page</Link>:<span/>}
   {page<pageCount?<Link href={href(page+1)} style={{color:"#20482f"}}>Next page</Link>:<span/>}
  </nav>
 </div>;
}
