"use client";
import {useState} from "react";
import Link from "next/link";
type Line={title:string;marketplaceUrl:string;variant:string|null;skuCode:string|null;quantity:number};
type RequestRow={
 id:string;userId:string;createdAt:string;customerEmail:string;postcode:string;notes:string;
 reviewState:"received"|"reviewing"|"needs_details"|"closed";reviewNote:string;
 lines:Line[];paymentStatus:"no_payment_requested";
};
const panel:React.CSSProperties={background:"#fff",border:"1px solid #dae4d8",padding:22,margin:"15px 0"};
const selectStyle:React.CSSProperties={border:"1px solid #bdceba",padding:"10px 12px",width:"100%",fontSize:13};
export default function AdminWarehousePage(){
 const [key,setKey]=useState("");
 const [requests,setRequests]=useState<RequestRow[]>([]);
 const [loading,setLoading]=useState(false),[saving,setSaving]=useState<string|null>(null);
 const [error,setError]=useState(""),[loaded,setLoaded]=useState(false);
 const [drafts,setDrafts]=useState<Record<string,{status:string;note:string}>>({});
 async function load(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!key||loading)return;
  setLoading(true);setError("");setLoaded(false);
  try{
   const response=await fetch("/api/admin/warehouse",{headers:{"x-herocon-checkout-admin":key},cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Request history unavailable.");
   if(!Array.isArray(data.requests))throw Error("Invalid request history.");
   setRequests(data.requests as RequestRow[]);
   setDrafts({});
   setLoaded(true);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load.");}
  finally{setLoading(false);}
 }
 async function update(row:RequestRow){
  if(saving)return;
  const draft=drafts[row.id]||{status:row.reviewState,note:row.reviewNote};
  if(!["reviewing","needs_details","closed"].includes(draft.status)){setError("Select a review status before saving.");return;}
  setSaving(row.id);setError("");
  try{
   const response=await fetch("/api/admin/warehouse",{
    method:"POST",headers:{"Content-Type":"application/json","x-herocon-checkout-admin":key},
    body:JSON.stringify({userId:row.userId,id:row.id,status:draft.status,note:draft.note}),
    cache:"no-store"
   });
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Review update failed.");
   setRequests(current=>current.map(item=>item.id===row.id?data.request as RequestRow:item));
  }catch(e){setError(e instanceof Error?e.message:"Review update failed.");}
  finally{setSaving(null);}
 }
 return <main style={{background:"#f3f7f0",minHeight:"100vh",padding:"40px 18px 90px",color:"#294733"}}>
  <div style={{maxWidth:1000,margin:"0 auto"}}>
   <Link href="/warehouse" style={{color:"#41654b",fontSize:12}}>HEROCON / WAREHOUSE CENTRE</Link>
   <h1 style={{font:"400 clamp(36px,5vw,56px) Georgia,serif",margin:"24px 0 10px"}}>Merchant quote review.</h1>
   <p style={{fontSize:14,lineHeight:1.8,maxWidth:690}}>Private review of customer requests. This page does not create supplier orders, charge payments, change warehouse statuses or contact HIOBuy.</p>
   <form onSubmit={load} style={{...panel,display:"flex",gap:12,flexWrap:"wrap",alignItems:"end"}}>
    <label style={{flex:"1 1 300px",fontSize:12,fontWeight:700}}>Existing Herocon checkout admin key
     <input type="password" autoComplete="off" required value={key} onChange={e=>setKey(e.target.value)} style={{...selectStyle,display:"block",marginTop:6}}/>
    </label>
    <button type="submit" disabled={loading||!key} style={{background:"#294f35",color:"white",border:0,padding:"13px 22px",cursor:"pointer"}}>{loading?"Loading…":"Load requests"}</button>
   </form>
   {error&&<p role="alert" style={{color:"#a34835",fontSize:13}}>{error}</p>}
   {loaded&&<p role="status" style={{fontSize:12,color:"#69816d"}}>{requests.length} recent quote requests. Updates are saved privately and appear in the customer's Warehouse centre.</p>}
   {loaded&&requests.length===0&&<p style={panel}>No saved customer requests yet.</p>}
   {requests.map(row=>{
    const draft=drafts[row.id]||{status:row.reviewState,note:row.reviewNote};
    return <article key={row.id} style={panel}>
     <div style={{display:"flex",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
      <div><strong>{row.customerEmail}</strong><p style={{fontSize:12,color:"#748677"}}>{new Date(row.createdAt).toLocaleString("en-GB")} · {row.postcode}</p><code style={{fontSize:11}}>{row.id}</code></div>
      <strong style={{fontSize:13}}>{row.reviewState.replaceAll("_"," ")}</strong>
     </div>
     <div style={{margin:"20px 0",borderTop:"1px solid #e4ebe2",paddingTop:12}}>
      {row.lines.map((line,i)=><p key={i} style={{fontSize:13,lineHeight:1.7}}><strong>{line.title}</strong> · Qty {line.quantity}{line.variant?" · "+line.variant:""} · <a href={line.marketplaceUrl} target="_blank" rel="noopener noreferrer">Seller listing</a></p>)}
      {row.notes&&<p style={{fontSize:13}}><strong>Customer note:</strong> {row.notes}</p>}
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,alignItems:"end"}}>
      <label style={{fontSize:12}}>Review status
       <select style={{...selectStyle,display:"block",marginTop:6}} value={draft.status} onChange={e=>setDrafts(old=>({...old,[row.id]:{...draft,status:e.target.value}}))}>
        <option value="received" disabled>Received</option>
        <option value="reviewing">Reviewing</option>
        <option value="needs_details">Needs details</option>
        <option value="closed">Closed</option>
       </select></label>
      <label style={{fontSize:12}}>Message visible to customer
       <textarea rows={2} maxLength={450} style={{...selectStyle,display:"block",marginTop:6}} value={draft.note} onChange={e=>setDrafts(old=>({...old,[row.id]:{...draft,note:e.target.value}}))}/>
      </label>
      <button type="button" disabled={saving!==null||draft.status==="received"} onClick={()=>update(row)} style={{border:0,background:"#294f35",color:"#fff",padding:"13px",cursor:"pointer"}}>{saving===row.id?"Saving…":"Save review"}</button>
     </div>
     <p style={{fontSize:11,color:"#758773",marginBottom:0}}>No order, supplier purchase, shipping reservation or payment is created by saving this review.</p>
    </article>;
   })}
  </div>
 </main>;
}
