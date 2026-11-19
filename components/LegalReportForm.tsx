"use client";
import {useState,type FormEvent} from "react";
type Kind="ip"|"dsa";
export default function LegalReportForm({kind}:{kind:Kind}){
 const [link,setLink]=useState("");
 const [reason,setReason]=useState("");
 const [category,setCategory]=useState(kind==="ip"?"Copyright":"Other suspected illegal content");
 const [person,setPerson]=useState("");
 const [reply,setReply]=useState("");
 const [rights,setRights]=useState("");
 const [confirmed,setConfirmed]=useState(false);
 const [notice,setNotice]=useState("");
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!confirmed)return;
  const subject=kind==="ip"?"Herocon intellectual property report":"Herocon illegal content report (DSA)";
  const body=[
   "Reporting category: "+category,
   "Herocon listing URL: "+link.trim(),
   "Reporter name (if provided): "+(person.trim()||"Not provided"),
   "Reply email (if provided): "+(reply.trim()||"Not provided"),
   ...(kind==="ip"?["Rights holder and protected work: "+rights.trim()]:[]),
   "Explanation and supporting details: "+reason.trim(),
   "I believe this report is accurate and submitted in good faith."
  ].join("\n\n");
  const mailto="mailto:aminabdul339@outlook.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
  setNotice("Your email app should open with the report prepared. The report is not submitted until you send that email.");
  window.location.href=mailto;
 }
 return <form className="hc-report-form" onSubmit={submit}>
  <label htmlFor={kind+"-category"}>Type of report</label>
  <select id={kind+"-category"} value={category} onChange={e=>setCategory(e.target.value)}>
   {kind==="ip"?<>
    <option>Copyright</option><option>Trademark</option><option>Other intellectual property right</option>
   </>:<>
    <option>Other suspected illegal content</option><option>Counterfeit or trademark-related listing</option>
    <option>Dangerous or prohibited product</option><option>Consumer fraud or deceptive listing</option>
    <option>Hateful or discriminatory content</option><option>Other EU-law concern</option>
   </>}
  </select>
  <label htmlFor={kind+"-link"}>Exact Herocon listing URL <span aria-hidden="true">*</span></label>
  <input id={kind+"-link"} type="url" required maxLength={700} placeholder="https://herocon.store/product/..." value={link} onChange={e=>setLink(e.target.value)} />
  {kind==="ip"&&<>
   <label htmlFor="ip-rights">Rights holder, protected work and evidence of rights <span aria-hidden="true">*</span></label>
   <textarea id="ip-rights" required rows={3} maxLength={800} placeholder="Identify the original work or mark and explain your connection to it." value={rights} onChange={e=>setRights(e.target.value)}/>
  </>}
  <label htmlFor={kind+"-reason"}>Why are you reporting this listing? <span aria-hidden="true">*</span></label>
  <textarea id={kind+"-reason"} required rows={5} maxLength={1800} placeholder="Describe the specific content, the issue and any relevant law or evidence." value={reason} onChange={e=>setReason(e.target.value)}/>
  <div className="hc-report-grid">
   <div><label htmlFor={kind+"-name"}>Your name (optional)</label><input id={kind+"-name"} maxLength={120} value={person} onChange={e=>setPerson(e.target.value)}/></div>
   <div><label htmlFor={kind+"-reply"}>Reply email (optional)</label><input id={kind+"-reply"} type="email" maxLength={180} value={reply} onChange={e=>setReply(e.target.value)}/></div>
  </div>
  <label className="hc-report-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required/><span>I confirm this report is made in good faith and that the information is accurate to the best of my knowledge.</span></label>
  <button type="submit" className="hc-legal-primary">Prepare report email <span aria-hidden="true">↗</span></button>
  <p className="hc-legal-small">This opens your email app; Herocon does not receive or store the report until you send it. Do not include passwords, bank details or unnecessary sensitive information.</p>
  {notice&&<p role="status" className="hc-legal-confirmation">{notice}</p>}
 </form>;
}
