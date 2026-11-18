"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
type Fields={product:string,quantity:string,destination:string,unitBudget:string,requirements:string,branding:string,timing:string};
const defaults:Fields={product:"",quantity:"50",destination:"United Kingdom",unitBudget:"",requirements:"",branding:"Not sure yet",timing:"Researching options"};
export default function SourcingBrief({initialProduct=""}:{initialProduct?:string}){
 const [values,setValues]=useState<Fields>({...defaults,product:initialProduct});
 const [ready,setReady]=useState(false),[copied,setCopied]=useState(false);
 const set=(key:keyof Fields,value:string)=>{setValues(v=>({...v,[key]:value}));setCopied(false);setReady(false);};
 const brief=useMemo(()=>[
  "HEROCON — PRODUCT SOURCING BRIEF",
  "Prepared on "+new Date().toLocaleDateString("en-GB"),
  "",
  "PRODUCT OR MARKETPLACE LINK",
  values.product.trim()||"Not supplied",
  "",
  "ESTIMATED QUANTITY",
  values.quantity.trim()||"To be confirmed",
  "",
  "DESTINATION COUNTRY",
  values.destination.trim()||"To be confirmed",
  "",
  "TARGET UNIT BUDGET",
  values.unitBudget.trim()?"£"+values.unitBudget.trim()+" per unit (excluding shipping and taxes)":"Open to quotations",
  "",
  "BRANDING REQUIREMENTS",
  values.branding,
  "",
  "TIMING",
  values.timing,
  "",
  "PRODUCT SPECIFICATIONS / QUALITY REQUIREMENTS",
  values.requirements.trim()||"Please confirm specification, materials and sample availability",
  "",
  "QUESTIONS TO CONFIRM BEFORE ORDERING",
  "1. What is the minimum order quantity and unit price at this quantity?",
  "2. Can I obtain a sample and what is the total sample cost?",
  "3. What are lead times, domestic shipping and export packing details?",
  "4. What are estimated freight, customs and sourcing or service fees?",
  "5. What evidence of product specifications, safety and quality is available?",
  "",
  "Note: This is a planning brief only. Herocon has not received it, placed an order or obtained a quotation."
 ].join("\n"),[values]);
 async function copy(){try{await navigator.clipboard.writeText(brief);setCopied(true);}catch{setReady(true);}}
 function download(){const blob=new Blob([brief],{type:"text/plain;charset=utf-8"});const href=URL.createObjectURL(blob);const a=document.createElement("a");a.href=href;a.download="herocon-sourcing-brief.txt";a.click();URL.revokeObjectURL(href);}
 return <div className="sc-sourcing-grid"><form className="sc-brief-form" onSubmit={e=>{e.preventDefault();setReady(true);}}>
   <label htmlFor="sb-product">Product name or marketplace URL <span>*</span></label><textarea id="sb-product" rows={3} value={values.product} onChange={e=>set("product",e.target.value)} required placeholder="Paste a 1688, Taobao or Weidian product link, or describe the product"/>
   <div className="sc-form-pair"><div><label htmlFor="sb-qty">Quantity needed <span>*</span></label><input id="sb-qty" type="number" min="1" max="1000000" required value={values.quantity} onChange={e=>set("quantity",e.target.value)}/></div><div><label htmlFor="sb-country">Delivery country <span>*</span></label><input id="sb-country" required maxLength={80} value={values.destination} onChange={e=>set("destination",e.target.value)}/></div></div>
   <div className="sc-form-pair"><div><label htmlFor="sb-budget">Target price per unit (£, optional)</label><input id="sb-budget" min="0" type="number" step=".01" value={values.unitBudget} onChange={e=>set("unitBudget",e.target.value)} placeholder="e.g. 3.50"/></div><div><label htmlFor="sb-branding">Branding requirement</label><select id="sb-branding" value={values.branding} onChange={e=>set("branding",e.target.value)}><option>Not sure yet</option><option>No custom branding</option><option>Custom packaging</option><option>Custom product branding</option></select></div></div>
   <label htmlFor="sb-timing">When do you need the order?</label><select id="sb-timing" value={values.timing} onChange={e=>set("timing",e.target.value)}><option>Researching options</option><option>Within 1 month</option><option>Within 2–3 months</option><option>More than 3 months away</option></select>
   <label htmlFor="sb-notes">Material, size, colour or quality requirements</label><textarea id="sb-notes" rows={5} value={values.requirements} onChange={e=>set("requirements",e.target.value)} placeholder="Describe materials, dimensions, colours, packaging, certifications or sample requirements"/>
   <button className="sc-button sc-button-dark sc-form-submit" type="submit">Generate my sourcing brief ↗</button>
 </form>
 <aside className="sc-brief-preview"><span className="sc-kicker">YOUR SOURCING REQUEST</span><h3>Turn your idea into a clear supplier enquiry.</h3><p>Complete the form to create a downloadable brief with your product, quantity and questions to ask before ordering.</p>
 {ready&&<><pre className="sc-generated-brief">{brief}</pre><div className="sc-brief-actions"><button type="button" className="sc-button sc-button-dark" onClick={copy}>{copied?"Copied ✓":"Copy brief"}</button><button type="button" className="sc-button sc-button-outline" onClick={download}>Download .txt ↗</button></div></>}
 {!ready&&<div className="sc-brief-preview-steps"><div><span>01</span> Your product link</div><div><span>02</span> Order requirements</div><div><span>03</span> Questions for the supplier</div><div><span>04</span> A brief you can share</div></div>}
 <div className="sc-brief-disclosure"><strong>How this works</strong><p>The brief is generated in your browser. It is <b>not sent to Herocon or a supplier</b>. You can copy or download it and keep it for your own records or share it when requesting a quote. There is no supplier verification or quote guarantee.</p><Link href="/landed-cost">Estimate the costs first ↗</Link></div>
 </aside></div>;
}