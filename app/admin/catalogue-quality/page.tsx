"use client";

import Link from "next/link";
import {useState} from "react";

type Row={id:string;title:string;category:string;marketplace:string;
  originalMarketplaceUrl:string;priceGBP:number|null;sellerName:string|null;
  photoCount:number;variantCount:number;hasSupplierSnapshot:boolean};
type Result={
 ok:boolean;stats?:Record<string,number>;marketplaces?:Record<string,number>;
 categorySummary?:{name:string;count:number}[];review?:Row[];
 notice?:string;error?:string
};
const panel={background:"#fff",border:"1px solid #d8e0d7",borderRadius:9,padding:"24px"};
const labelStyle={fontSize:12,fontWeight:700 as const,color:"#516952"};
function Stat({label,value,detail}:{label:string;value:number;detail?:string}){
 return <div style={{background:"#fff",border:"1px solid #d8e0d7",padding:"19px",borderRadius:8}}>
  <div style={labelStyle}>{label}</div>
  <div style={{font:"400 33px Georgia,serif",color:"#243d2e",marginTop:9}}>{value.toLocaleString()}</div>
  {detail&&<div style={{fontSize:11,color:"#708273",marginTop:6}}>{detail}</div>}
 </div>;
}
export default function CatalogueQuality(){
 const [secret,setSecret]=useState("");
 const [loading,setLoading]=useState(false);
 const [exporting,setExporting]=useState(false);
 const [data,setData]=useState<Result|null>(null);
 const [error,setError]=useState("");
 async function load(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!secret||loading)return;
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/catalogue-quality",{
    headers:{"x-herocon-catalogue-admin":secret},cache:"no-store"
   });
   const value=await response.json() as Result;
   if(!response.ok)throw Error(response.status===401?"Invalid catalogue-import admin key.":value.error||"Unable to inspect catalogue.");
   setData(value);
  }catch(err){setError(err instanceof Error?err.message:"Catalogue report unavailable.");setData(null);}
  finally{setLoading(false);}
 }
 async function download(){
  if(!secret||exporting)return;
  setExporting(true);setError("");
  try{
   const response=await fetch("/api/admin/catalogue-quality?format=csv",{
    headers:{"x-herocon-catalogue-admin":secret},cache:"no-store"
   });
   if(!response.ok)throw Error("Catalogue export unavailable.");
   const blob=await response.blob();
   const href=URL.createObjectURL(blob);
   const a=document.createElement("a");
   a.href=href;a.download="herocon-catalogue-audit.csv";document.body.appendChild(a);
   a.click();a.remove();URL.revokeObjectURL(href);
  }catch(err){setError(err instanceof Error?err.message:"Export failed.");}
  finally{setExporting(false);}
 }
 const summary=data?.stats;
 const metrics=summary?[
  ["All indexed products",summary.total],
  ["Verified source links",summary.withVerifiedMarketplaceLink],
  ["Products with photos",summary.withPrimaryPhoto],
  ["Multiple photos",summary.withMultiplePhotos],
  ["GBP reference prices",summary.withGBPReferencePrice],
  ["Recorded seller names",summary.withSellerName],
  ["Products with variants",summary.withRecordedOptions],
  ["Saved supplier snapshots",summary.withSavedSupplierSnapshot]
 ] as const:[];
 return <main style={{background:"#f6f8f3",minHeight:"100vh",fontFamily:"Arial,Helvetica,sans-serif",color:"#263e2d",padding:"30px 0 70px"}}>
  <div style={{maxWidth:1110,margin:"0 auto",padding:"0 20px"}}>
   <Link href="/" style={{textDecoration:"none",fontSize:12,fontWeight:700,color:"#466449"}}>HEROCON / PRIVATE OPERATIONS</Link>
   <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",flexWrap:"wrap",margin:"23px 0 23px"}}>
    <div><p style={{fontSize:11,letterSpacing:2,fontWeight:700,marginBottom:9,color:"#728775"}}>CATALOGUE INTELLIGENCE</p>
      <h1 style={{font:"400 clamp(34px,5vw,49px)/1.1 Georgia,serif",letterSpacing:"-.035em",margin:0}}>Product data <em>coverage.</em></h1>
      <p style={{fontSize:14,lineHeight:1.7,color:"#667a69",maxWidth:690}}>Review the records already collected, identify missing seller and option details, and export verified marketplace product links without new supplier charges.</p>
    </div>
    <Link href="/admin/catalogue-import" style={{fontSize:13,color:"#41644d",textDecoration:"underline"}}>Existing supplier import tools</Link>
   </div>
   <form onSubmit={load} style={{...panel,display:"flex",gap:15,flexWrap:"wrap",alignItems:"end"}}>
    <label style={{fontSize:13,fontWeight:700,flex:"1 1 280px"}}>Private Herocon catalogue-import key
     <input type="password" value={secret} onChange={e=>setSecret(e.target.value)} required autoComplete="off" style={{display:"block",width:"100%",boxSizing:"border-box",border:"1px solid #b8c8bb",padding:"12px 13px",fontSize:14,borderRadius:5,marginTop:7}}/>
    </label>
    <button type="submit" disabled={!secret||loading} style={{background:"#294b34",color:"white",border:0,borderRadius:5,padding:"13px 20px",cursor:"pointer",fontSize:13}}>{loading?"Checking…":"Inspect catalogue"}</button>
    {data?.ok&&<button type="button" onClick={download} disabled={exporting} style={{background:"#eef3eb",color:"#294b34",border:"1px solid #b8c8bb",borderRadius:5,padding:"12px 18px",cursor:"pointer",fontSize:13}}>{exporting?"Preparing…":"Download complete CSV"}</button>}
   </form>
   {error&&<p role="alert" style={{fontSize:13,color:"#a33e36",marginTop:14}}>{error}</p>}
   {summary&&data&&<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(205px,1fr))",gap:12,marginTop:18}}>
      {metrics.map(([label,value])=><Stat key={label} label={label} value={value}/>)}
    </div>
    <p style={{fontSize:12,lineHeight:1.7,color:"#637566",margin:"17px 0 26px"}}>{data.notice}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:15}}>
     <section style={panel}><h2 style={{font:"400 25px Georgia,serif",margin:"0 0 16px"}}>Marketplace breakdown</h2>
      {Object.entries(data.marketplaces||{}).sort((a,b)=>b[1]-a[1]).map(([name,count])=>
       <div key={name} style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #edf1eb",padding:"11px 0",fontSize:13}}>
        <span>{name}</span><strong>{count.toLocaleString()}</strong>
       </div>)}
     </section>
     <section style={panel}><h2 style={{font:"400 25px Georgia,serif",margin:"0 0 16px"}}>Largest categories</h2>
      {(data.categorySummary||[]).slice(0,9).map(c=>
       <div key={c.name} style={{display:"flex",justifyContent:"space-between",gap:12,borderTop:"1px solid #edf1eb",padding:"11px 0",fontSize:13}}>
        <span>{c.name}</span><strong>{c.count.toLocaleString()}</strong>
       </div>)}
     </section>
    </div>
    <section style={{...panel,marginTop:17}}>
     <h2 style={{font:"400 26px Georgia,serif",margin:"0 0 7px"}}>Listings needing enrichment</h2>
     <p style={{color:"#637566",fontSize:13,lineHeight:1.7}}>Preview of 30 records lacking a seller name, recorded variant options or multiple photographs. The CSV export contains the complete catalogue and full source links.</p>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,textAlign:"left",minWidth:660}}>
       <thead><tr>{["Product","Marketplace","Seller","Photos","Variants","Saved details"].map(x=><th key={x} style={{padding:"12px 8px",borderBottom:"1px solid #d8e0d7",color:"#637566"}}>{x}</th>)}</tr></thead>
       <tbody>{(data.review||[]).map(x=><tr key={x.id}>
        <td style={{padding:"11px 8px",borderBottom:"1px solid #edf1eb",maxWidth:330}}>
          <Link href={"/product/"+encodeURIComponent(x.id)} style={{color:"#294b34",textDecoration:"underline"}}>{x.title.length>85?x.title.slice(0,85)+"...":x.title}</Link>
        </td>
        <td style={{padding:"11px 8px",borderBottom:"1px solid #edf1eb"}}>{x.marketplace}</td>
        <td style={{padding:"11px 8px",borderBottom:"1px solid #edf1eb"}}>{x.sellerName||"Not recorded"}</td>
        <td style={{padding:"11px 8px",borderBottom:"1px solid #edf1eb"}}>{x.photoCount}</td>
        <td style={{padding:"11px 8px",borderBottom:"1px solid #edf1eb"}}>{x.variantCount||"Not recorded"}</td>
        <td style={{padding:"11px 8px",borderBottom:"1px solid #edf1eb"}}>{x.hasSupplierSnapshot?"Yes":"No"}</td>
       </tr>)}</tbody>
      </table>
     </div>
    </section>
    <p style={{fontSize:12,color:"#6d7e70",marginTop:22,lineHeight:1.7}}>Prices are historical catalogue references, not live supplier quotes. Snapshot coverage does not guarantee live stock or pricing. No direct marketplace scraping or external API lookups occur when generating this report.</p>
   </>}
  </div>
 </main>;
}
