"use client";
import {useEffect,useState} from "react";
const KEY="herocon-privacy-preferences-v1";
export default function CookieSettingsPanel(){
 const [loaded,setLoaded]=useState(false);
 const [saved,setSaved]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{
  try{setSaved(Boolean(localStorage.getItem(KEY)));}catch{}
  setLoaded(true);
 },[]);
 function reject(){
  try{localStorage.setItem(KEY,JSON.stringify({version:1,essential:true,analytics:false,advertising:false,updatedAt:new Date().toISOString()}));
   setSaved(true);setMessage("Your preference has been saved. Optional analytics and advertising tracking remain off.");
  }catch{setMessage("Your browser did not allow this preference to be saved.");}
 }
 function clear(){
  try{
   localStorage.removeItem("herocon-cart-v1");
   localStorage.removeItem("herocon-saved");
   localStorage.removeItem(KEY);
   window.location.reload();
  }catch{setMessage("Unable to clear local site data. You can also clear storage through your browser settings.");}
 }
 return <div className="hc-cookie-panel">
  <div className="hc-cookie-setting"><div><h3>Essential site storage</h3><p>Used to remember your saved products, cart selections and privacy choice in this browser. It supports features you request.</p></div><span className="hc-cookie-status">When needed</span></div>
  <div className="hc-cookie-setting"><div><h3>Optional analytics and advertising tracking</h3><p>Herocon does not currently install optional analytics or advertising trackers through its own application code. No opt-in switch is needed while these are inactive.</p></div><span className="hc-cookie-status hc-cookie-off">Not in use</span></div>
  <div className="hc-cookie-actions">
   <button onClick={reject} type="button" className="hc-legal-primary">Keep optional tracking off</button>
   <button onClick={clear} type="button" className="hc-legal-secondary">Clear cart, saved items & preferences</button>
  </div>
  {loaded&&saved&&!message&&<p className="hc-legal-small">A privacy preference is saved on this device.</p>}
  {message&&<p className="hc-legal-confirmation" role="status">{message}</p>}
  <p className="hc-legal-small">Third-party sites you choose to visit have their own tracking and privacy practices. This page cannot control cookies on those websites.</p>
 </div>;
}
