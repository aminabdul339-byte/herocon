"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useCart} from "@/components/CartProvider";
import {ArrowIcon} from "@/components/ArrowIcon";

type ParcelRow={id:string;name:string;grams:string};
const blank=(id="initial"):ParcelRow=>({id,name:"",grams:""});
const prefix="herocon-consolidation-plan-v1:";
function validStored(value:unknown):value is ParcelRow[]{
 return Array.isArray(value)&&value.length<=8&&value.every(v=>v&&typeof v==="object"&&
  typeof v.id==="string"&&v.id.length<60&&typeof v.name==="string"&&v.name.length<=80&&
  typeof v.grams==="string"&&v.grams.length<=10);
}
export default function ConsolidationPlanner(){
 const {account}=useCart();
 const [rows,setRows]=useState<ParcelRow[]>([blank()]);
 const [loadedFor,setLoadedFor]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  const userId=account.status==="authenticated"?account.id:null;
  setLoadedFor(null);
  if(!userId){setRows([blank()]);return;}
  try{
   const stored:unknown=JSON.parse(localStorage.getItem(prefix+userId)||"null");
   setRows(validStored(stored)&&stored.length?stored:[blank()]);
  }catch{setRows([blank()]);}
  setLoadedFor(userId);
 },[account.status,account.id]);
 useEffect(()=>{
  if(!loadedFor||account.status!=="authenticated"||account.id!==loadedFor)return;
  try{localStorage.setItem(prefix+loadedFor,JSON.stringify(rows));}catch{}
 },[rows,loadedFor,account.status,account.id]);
 const summary=useMemo(()=>{
  const entered=rows.filter(r=>r.name.trim()||r.grams.trim());
  const valid=entered.filter(r=>Number.isInteger(Number(r.grams))&&Number(r.grams)>=1&&Number(r.grams)<=60000);
  return {entered:entered.length,valid:valid.length,weight:valid.reduce((total,r)=>total+Number(r.grams),0),
   complete:entered.length>0&&entered.length===valid.length};
 },[rows]);
 function patch(id:string,changes:Partial<ParcelRow>){setRows(current=>current.map(row=>row.id===id?{...row,...changes}:row));setNotice("");}
 function reset(){
  setRows([blank()]);setNotice("Your draft has been cleared on this device.");
 }
 return <section className="hc-wh-planner" aria-labelledby="hc-wh-planner-title">
  <p className="sc-kicker">FREE PLANNING TOOL / NOT A WAREHOUSE INSTRUCTION</p>
  <h2 id="hc-wh-planner-title">Plan your next <em>parcel consolidation.</em></h2>
  <p>List up to eight parcels and their estimated weights to see a combined weight before requesting an international shipping quotation. You can use any labels; do not enter access codes, addresses or sensitive tracking credentials.</p>
  <div className="hc-wh-planner-grid">
   <div className="hc-wh-planner-edit">
    <div className="hc-wh-planner-header"><h3>Your planned parcels</h3><span>{rows.length} of 8</span></div>
    {rows.map((row,i)=><div className="hc-wh-plan-row" key={row.id}>
     <div><label htmlFor={"hc-wh-name-"+row.id}>Parcel {i+1} label</label>
      <input id={"hc-wh-name-"+row.id} value={row.name} maxLength={80} placeholder="e.g. Clothing order" onChange={e=>patch(row.id,{name:e.target.value})}/></div>
     <div><label htmlFor={"hc-wh-grams-"+row.id}>Estimated weight (g)</label>
      <input id={"hc-wh-grams-"+row.id} type="number" min="1" max="60000" step="1" value={row.grams} onChange={e=>patch(row.id,{grams:e.target.value})} placeholder="e.g. 850"/></div>
     <button type="button" aria-label={"Remove parcel "+(i+1)} disabled={rows.length===1} onClick={()=>setRows(current=>current.filter(v=>v.id!==row.id))}>Remove</button>
    </div>)}
    <div className="hc-wh-planner-actions"><button type="button" disabled={rows.length>=8} onClick={()=>setRows(current=>[...current,blank("row-"+Date.now()+"-"+Math.random().toString(36).slice(2))])}>Add another parcel</button><button type="button" className="hc-wh-reset" onClick={reset}>Clear plan</button></div>
    {notice&&<p role="status" className="hc-wh-muted">{notice}</p>}
    <p className="hc-wh-muted">{account.status==="authenticated"?"Your draft labels and weights are saved in this browser for your account. They are not sent to Herocon or a warehouse.":"This draft stays in this browser session. Sign in to save it on this device."}</p>
   </div>
   <aside className="hc-wh-plan-summary">
    <p className="sc-kicker">PLANNING SUMMARY</p>
    <span className="hc-wh-plan-number">{(summary.weight/1000).toFixed(3)} <small>kg</small></span>
    <p>Combined estimated actual weight from {summary.valid} {summary.valid===1?"parcel":"parcels"}.</p>
    {!summary.complete&&<p role="status" className="hc-wh-plan-warning">Enter a valid weight of 1–60,000 g for every planned parcel to complete the summary.</p>}
    <p>This is not the final chargeable weight. The warehouse must confirm packing, dimensions, restrictions and final carrier fees.</p>
    <Link href="/landed-cost" className="hc-wh-summary-link">Open shipping estimator <ArrowIcon/></Link>
   </aside>
  </div>
 </section>;
}
