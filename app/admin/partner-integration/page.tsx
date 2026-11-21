"use client";

import {useState} from "react";
import Link from "next/link";

type Check={
 ok:boolean;connection?:string;apiKeyConfigured?:boolean;
 webhookSecretConfigured?:boolean;catalogue?:string;
 productCountFirstPage?:number|null;catalogueError?:string|null;
 writeActionsEnabled?:boolean;error?:string;requestId?:string
};
const guidance:Record<string,string>={
 "api_not_enabled":"Fulfillbot has not enabled API access for this account. Open Fulfillbot Settings, then API access, check whether an access request or approval is needed, and contact your account manager if it remains disabled.",
 "account_action_required":"Sign in to Fulfillbot and finish any required account step, such as changing a temporary password. Then run this test again.",
 "insufficient_scope":"Your key lacks access to this endpoint. Create a Custom read-only key with View products and inventory and the other viewing permissions, save it to Vercel, redeploy, and retry.",
 "invalid_api_key":"This API key may be incorrect, expired or revoked. Check the production FULFILLBOT_API_KEY value in Vercel without posting the key in chat.",
 "partner_permission_or_account":"Fulfillbot returned a 403 permission response without a recognisable code. Ask their account manager to check API account access; include the request ID below if one is shown.",
 "partner_unavailable":"Herocon could not reach the partner API. Retry after checking the partner service status.",
 "rate_limited":"Too many API requests have been sent. Wait before retrying.",
 "partner_api_error":"The partner API returned an unexpected error. Please contact the partner's support team if this continues."
};
const styles={
 shell:{maxWidth:780,margin:"60px auto",padding:"0 22px",color:"#263f31",fontFamily:"Arial,Helvetica,sans-serif"},
 panel:{border:"1px solid #cfddd1",background:"#fff",padding:30,borderRadius:8},
 field:{width:"100%",boxSizing:"border-box" as const,padding:"13px 15px",fontSize:14,border:"1px solid #b8c9b8",borderRadius:5,marginTop:8},
 badge:{fontSize:12,fontWeight:700 as const}
};
export default function PartnerIntegrationAdmin(){
 const [privateKey,setPrivateKey]=useState("");
 const [busy,setBusy]=useState(false);
 const [check,setCheck]=useState<Check|null>(null);
 const [error,setError]=useState("");
 async function test(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!privateKey||busy)return;
  setBusy(true);setCheck(null);setError("");
  try{
   const response=await fetch("/api/admin/partner-integration/status",{
     method:"GET",cache:"no-store",headers:{"x-herocon-catalogue-admin":privateKey}
   });
   const body=await response.json() as Check;
   if(response.status===401)throw Error("Private admin key was not accepted. Use your existing Herocon catalogue-import key.");
   setCheck(body);
   if(!response.ok)setError("The read-only check did not complete: "+(body.error||"unknown error"));
  }catch(e){setError(e instanceof Error?e.message:"Connection check failed.");}
  finally{setBusy(false);}
 }
 const outcome=check?.connection==="connected";
 return <main style={{background:"#f7f9f4",minHeight:"100vh",padding:"28px 0 75px"}}>
  <div style={styles.shell}>
   <Link href="/" style={{color:"#456b50",fontSize:12,textDecoration:"none",fontWeight:700}}>HEROCON / PRIVATE OPERATIONS</Link>
   <h1 style={{font:"400 clamp(35px,5vw,52px)/1.07 Georgia,serif",letterSpacing:"-.04em",margin:"22px 0 14px"}}>Sourcing partner <em>connection.</em></h1>
   <p style={{color:"#617765",lineHeight:1.8,fontSize:14,marginBottom:26}}>
    Test access to your connected sourcing partner without creating or changing any orders, shipments or payments.
   </p>
   <section style={styles.panel}>
    <form onSubmit={test}>
      <label htmlFor="private-admin-key" style={{display:"block",fontWeight:700,fontSize:13}}>Private Herocon catalogue-import key</label>
      <input id="private-admin-key" style={styles.field} value={privateKey} onChange={e=>setPrivateKey(e.target.value)}
        type="password" autoComplete="off" spellCheck={false} placeholder="Your existing private admin key" required/>
      <p style={{fontSize:12,lineHeight:1.6,color:"#5b7560",margin:"9px 0 20px"}}>
       This uses your existing Herocon admin key, not the sourcing partner API key. Your input stays on this page and is sent only to your Herocon server for verification.
      </p>
      <button type="submit" disabled={!privateKey.trim()||busy}
       style={{background:"#284b36",border:0,color:"#fff",borderRadius:5,padding:"13px 20px",fontSize:13,fontWeight:750,cursor:"pointer",opacity:busy?.7:1}}>
       {busy?"Checking connection…":"Test read-only connection"}
      </button>
    </form>
    {error&&<div role="alert" style={{marginTop:22,color:"#9c4132",fontSize:13,lineHeight:1.7}}>
      <strong>{error}</strong>
      {check?.error&&guidance[check.error]&&<p style={{margin:"8px 0 0"}}>{guidance[check.error]}</p>}
      {check?.requestId&&<p style={{margin:"8px 0 0"}}>Partner support request ID: <code>{check.requestId}</code></p>}
    </div>}
    {check&&<div aria-live="polite" style={{marginTop:24,padding:22,background:"#f4f8f3",borderRadius:6,border:"1px solid #d4e2d1"}}>
      <h2 style={{margin:"0 0 16px",font:"400 25px Georgia,serif"}}>{outcome?"API connection verified":"Connection requires attention"}</h2>
      <dl style={{display:"grid",gridTemplateColumns:"minmax(155px,1fr) auto",rowGap:14,columnGap:20,fontSize:13,lineHeight:1.5,margin:0}}>
       <dt>API key configured</dt><dd style={styles.badge}>{check.apiKeyConfigured?"Yes":"No"}</dd>
       <dt>API authentication</dt><dd style={styles.badge}>{outcome?"Successful":"Not confirmed"}</dd>
       <dt>Product catalogue read</dt><dd style={styles.badge}>{check.catalogue==="readable"?"Successful":check.catalogueError||"Not confirmed"}</dd>
       <dt>Products on first API page</dt><dd style={styles.badge}>{typeof check.productCountFirstPage==="number"?check.productCountFirstPage:"—"}</dd>
       <dt>Webhook secret configured</dt><dd style={styles.badge}>{check.webhookSecretConfigured?"Yes":"No"}</dd>
       <dt>Order and shipment write actions</dt><dd style={styles.badge}>Disabled in Herocon</dd>
      </dl>
      <p style={{fontSize:12,lineHeight:1.6,margin:"18px 0 0",color:"#5f7662"}}>A successful test confirms the API can be reached and read. A real signed webhook delivery must be checked separately. This tool never returns your customer data or token.</p>
    </div>}
   </section>
   <p style={{fontSize:12,lineHeight:1.8,color:"#637b65",marginTop:22}}>Security reminder: the sourcing partner API key should have read-only permissions. Existing keys with ordering or shipping write access should be replaced with restricted keys before enabling further integrations.</p>
  </div>
 </main>;
}
