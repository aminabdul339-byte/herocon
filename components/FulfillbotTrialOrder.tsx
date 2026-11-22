"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

type Summary={
  productId:string;title:string;marketplaceUrl:string;
  countryCode:string;specs:string;quantity:number;purpose:string
};
type Preview={
  ok:boolean;mode?:string;submitted?:boolean;summary?:Summary;
  submissionEnabled?:boolean;error?:string;note?:string;
  requestId?:string;requestNumber?:string;status?:string;
};
type Connection={ok:boolean;connected?:boolean;scopes?:string[];trialSubmissionEnabled?:boolean;error?:string};
type SupplierPreflight={ok:boolean;error?:string;provider?:string;title?:string;sourceVariantCount?:number;minimumQuantity?:number|null;available?:boolean|null;checkedAt?:string;variants?:Array<{skuCode:string;label:string;options:Array<{name:string;value:string}>;priceCNY:number|null;stock:number|null;available:boolean}>;note?:string};
type Props={
  productId:string;title:string;image?:string;sourceUrl?:string;
  recordedPrice?:string;initialSpecs:string;owner:boolean
};

const titleStyle:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:"clamp(2rem,4vw,3.7rem)",fontWeight:400,letterSpacing:"-.04em",lineHeight:1.1};
const panelStyle:React.CSSProperties={background:"#fff",border:"1px solid #d8d7c9",borderRadius:12,padding:"clamp(18px,3vw,34px)"};
const inputStyle:React.CSSProperties={width:"100%",padding:"13px 14px",border:"1px solid #a5afa0",borderRadius:5,fontSize:16,background:"#fff",color:"#1d2920"};
const btnStyle:React.CSSProperties={padding:"14px 22px",background:"#20482f",color:"#fff",border:"none",borderRadius:5,cursor:"pointer",fontWeight:700};
const subdued:React.CSSProperties={fontSize:14,color:"#566356",lineHeight:1.65};
function errorLabel(error?:string) {
  const names:Record<string,string>={
    owner_sign_in_required:"Only the signed-in Herocon trial owner can make a sourcing request.",
    invalid_api_key:"Fulfillbot rejected this API key. Check API access settings.",
    insufficient_scope:"The Fulfillbot API key needs requests:write permission.",
    partner_permission_or_account:"Fulfillbot account access has not been authorised for this operation.",
    upstream_html_forbidden:"Fulfillbot blocked the connection. Please check account/API access with its support team.",
    trial_submission_disabled:"Submitting real sourcing requests has not been enabled for this trial.",
    variant_specification_required:"Please enter the exact colour and style option.",
    request_in_progress:"Fulfillbot is already processing this request.",
    owner_backend_unavailable:"The Herocon owner's secure backend configuration is incomplete."
  };
  return names[error||""]||"The operation could not be completed. "+(error||"Please try again.");
}
export default function FulfillbotTrialOrder({productId,title,image,sourceUrl,recordedPrice,initialSpecs,owner}:Props) {
  const [specs,setSpecs]=useState(initialSpecs);
  const [countryCode,setCountryCode]=useState("GB");
  const [connection,setConnection]=useState<Connection|null>(null);
  const [connectionBusy,setConnectionBusy]=useState(false);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const [requestId,setRequestId]=useState("");
  const [requestStatus,setRequestStatus]=useState("");
  const [trackingBusy,setTrackingBusy]=useState(false);
  const [supplier,setSupplier]=useState<SupplierPreflight|null>(null);
  const [supplierBusy,setSupplierBusy]=useState(false);


  useEffect(()=>{
    if(!owner)return;
    const controller=new AbortController();
    setConnectionBusy(true);
    fetch("/api/fulfillbot/trial",{cache:"no-store",credentials:"same-origin",signal:controller.signal})
      .then(async r=>({ok:r.ok,body:await r.json() as Connection}))
      .then(({ok,body})=>{if(!controller.signal.aborted)setConnection(ok?body:{ok:false,error:body.error});})
      .catch(()=>{if(!controller.signal.aborted)setConnection({ok:false,error:"connection_unavailable"});})
      .finally(()=>{if(!controller.signal.aborted)setConnectionBusy(false);});
    return ()=>controller.abort();
  },[owner]);

  async function action(mode:"preview"|"submit") {
    setError("");setSubmitting(true);
    try{
      const result=await fetch("/api/fulfillbot/trial",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          mode,productId,specs:specs.trim(),countryCode,
          ...(mode==="submit"?{confirm:"SEND_FULFILLBOT_QUOTE_REQUEST"}:{})
        })
      });
      const body=await result.json() as Preview;
      if(!result.ok||body.ok!==true)throw Error(errorLabel(body.error));
      if(mode==="preview"){setPreview(body);setConfirmed(false);}
      else if(body.requestId){
        setRequestId(body.requestId);setRequestStatus(body.status||"Submitted");
        setPreview(null);
        try{sessionStorage.setItem("herocon-fulfillbot-trial-"+productId,body.requestId);}catch{}
      }else throw Error("Fulfillbot did not return a request number.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to process this request.");}
    finally{setSubmitting(false);}
  }
  async function checkLiveSupplier(){
    if(supplierBusy)return;
    setSupplierBusy(true);setSupplier(null);setError("");
    try{
      const response=await fetch("/api/automatic-purchasing/preflight",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({productId})
      });
      const data=await response.json() as SupplierPreflight;
      if(!response.ok||!data.ok)throw Error(errorLabel(data.error));
      setSupplier(data);
    }catch(e){setError(e instanceof Error?e.message:"Supplier details could not be checked.");}
    finally{setSupplierBusy(false);}
  }
  async function track() {
    if(!requestId)return;
    setTrackingBusy(true);setError("");
    try{
      const r=await fetch("/api/fulfillbot/trial?requestId="+encodeURIComponent(requestId),{
        cache:"no-store",credentials:"same-origin"
      });
      const result=await r.json() as {ok?:boolean;request?:unknown;error?:string};
      if(!r.ok||!result.ok)throw Error(errorLabel(result.error));
      const envelope=result.request as Record<string,unknown>|undefined;
      const data=envelope?.data&&typeof envelope.data==="object"?envelope.data as Record<string,unknown>:envelope;
      const status=typeof data?.status==="string"?data.status:"Request retrieved";
      setRequestStatus(status);
    }catch(e){setError(e instanceof Error?e.message:"Could not refresh request status.");}
    finally{setTrackingBusy(false);}
  }

  const enabled=Boolean(connection?.ok&&connection.connected&&connection.scopes?.includes("requests:write")
    &&connection.trialSubmissionEnabled);
  const canSubmit=Boolean(preview?.ok&&preview.summary?.specs===specs.trim()
    &&preview.summary?.countryCode===countryCode&&confirmed&&enabled);
  const accountDestination="/account?next="+encodeURIComponent("/trial-order?productId="+encodeURIComponent(productId));
  return <section style={{maxWidth:1080,margin:"0 auto",padding:"44px 22px 90px",color:"#1d2920"}}>
    <p style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"#677867"}}>HEROCON / SOURCING PILOT</p>
    <h1 style={titleStyle}>Trial sourcing, <em>within Herocon.</em></h1>
    <p style={{...subdued,fontSize:16,maxWidth:680}}>
      Review one item, request a supplier quote and follow the request without leaving Herocon.
      Fulfillbot still requires its own portal for accepting quotes and paying purchase orders.
    </p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,360px),1fr))",gap:22,marginTop:30}}>
      <div style={panelStyle}>
        {image&&<div style={{aspectRatio:"4/3",background:"#f5f4ef",borderRadius:6,overflow:"hidden",marginBottom:18}}>
          <img src={image} alt={title} style={{width:"100%",height:"100%",objectFit:"contain"}} referrerPolicy="no-referrer"/>
        </div>}
        <p style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:"#667869"}}>SELECTED PRODUCT</p>
        <h2 style={{fontSize:20,lineHeight:1.3}}>{title}</h2>
        <p style={subdued}>Quantity: <strong>1</strong> · {recordedPrice?<>Recorded Herocon price: <strong>{recordedPrice}</strong></>:"Supplier price not confirmed"}</p>
        <p style={subdued}>Product price is a historical reference. Delivery, service fees and taxes must be quoted separately.</p>
        {sourceUrl&&<p style={subdued}><a href={sourceUrl} rel="noopener noreferrer" target="_blank" style={{color:"#20482f",textDecoration:"underline"}}>View original 1688 / Taobao / Weidian listing</a></p>}
        <p style={subdued}><Link href={"/product/"+encodeURIComponent(productId)} style={{color:"#20482f",textDecoration:"underline"}}>Return to product</Link></p>
      </div>
      <div style={panelStyle}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:"#667869"}}>REQUEST A SOURCING QUOTE</p>
        {!owner?<div>
          <h2>Private pilot</h2>
          <p style={subdued}>This trial is currently available to the Herocon owner. Sign in to your registered owner account to prepare a request.</p>
          <Link href={accountDestination} style={{...btnStyle,display:"inline-block",textDecoration:"none"}}>Sign in to Herocon</Link>
        </div>:!sourceUrl?<p role="alert">A verified marketplace link is required before we can request sourcing.</p>:<>
          <label style={{display:"block",marginTop:20,fontWeight:700,fontSize:14}} htmlFor="fulfillbot-variant">Exact colour / style</label>
          <input id="fulfillbot-variant" value={specs}
            onChange={e=>{setSpecs(e.target.value);setPreview(null);setConfirmed(false);}}
            style={{...inputStyle,marginTop:7}} maxLength={300}
            placeholder="Example: Black-Alo" autoComplete="off"/>
          <label style={{display:"block",marginTop:20,fontWeight:700,fontSize:14}} htmlFor="fulfillbot-country">Destination country</label>
          <select id="fulfillbot-country" style={{...inputStyle,marginTop:7}} value={countryCode}
            onChange={e=>{setCountryCode(e.target.value);setPreview(null);setConfirmed(false);}}>
            <option value="GB">United Kingdom</option>
          </select>
          <p style={{...subdued,marginTop:18}} aria-live="polite">
            {connectionBusy?"Checking Fulfillbot connection…":
              connection?.ok?"Fulfillbot connection: available":
              connection?.error?"Fulfillbot connection: "+errorLabel(connection.error):
              "Fulfillbot connection not checked"}
          </p>
          <button type="button" style={{...btnStyle,opacity:submitting||!specs.trim()?0.45:1}}
            disabled={submitting||!specs.trim()} onClick={()=>void action("preview")}>
            {submitting?"Processing…":"Review sourcing request"}
          </button>
          {preview?.ok&&preview.summary&&<section style={{marginTop:20,padding:18,background:"#f3f5ef",borderRadius:7}}>
            <h3 style={{marginTop:0,fontSize:18}}>Ready for review</h3>
            <p style={subdued}><strong>{preview.summary.specs}</strong> · 1 unit · United Kingdom</p>
            <p style={subdued}>{preview.note}</p>
            {enabled?<label style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:14,lineHeight:1.5,margin:"18px 0"}}>
              <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{marginTop:4}}/>
              I approve sending this single-item sourcing request to Fulfillbot for a quote. I understand this is not a payment or purchase.
            </label>:<p role="status" style={{...subdued,color:"#7e5634"}}>
              Provider submission is not yet enabled or authorised. The draft is ready, but has not been sent to Fulfillbot.
            </p>}
            <button type="button" onClick={()=>void action("submit")} disabled={!canSubmit||submitting}
              style={{...btnStyle,opacity:!canSubmit||submitting?0.4:1}}>
              Send to Fulfillbot for a quote
            </button>
          </section>}
          {requestId&&<section style={{marginTop:20,padding:18,background:"#f3f5ef",borderRadius:7}} role="status">
            <h3 style={{marginTop:0}}>Sourcing request submitted</h3>
            <p style={subdued}>Reference: <strong>{requestId}</strong></p>
            <p style={subdued}>Status: <strong>{requestStatus}</strong></p>
            <button type="button" style={btnStyle} onClick={()=>void track()} disabled={trackingBusy}>
              {trackingBusy?"Checking…":"Refresh request status"}
            </button>
            <p style={subdued}>Review and accept any quote, and pay any purchase order, in the Fulfillbot portal.</p>
            <a href="https://app.fulfillbot.com" target="_blank" rel="noopener noreferrer" style={{color:"#20482f"}}>Open Fulfillbot portal</a>
          </section>}

          <section style={{marginTop:26,borderTop:"1px solid #d8d7c9",paddingTop:23}}>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:"#667869"}}>AUTOMATIC PURCHASING / LIVE SUPPLIER CHECK</p>
            <p style={subdued}>Check whether our connected sourcing partner can identify a purchasable SKU, stock, live item price and minimum quantity for this exact marketplace link. No order is submitted.</p>
            <button type="button" style={{...btnStyle,background:"#e9efe7",color:"#20482f",border:"1px solid #a9bba5",opacity:supplierBusy?0.5:1}}
              disabled={supplierBusy} onClick={()=>void checkLiveSupplier()}>
              {supplierBusy?"Checking live supplier…":"Check live supplier SKU"}
            </button>
            {supplier?.ok&&<div style={{marginTop:17,padding:16,background:"#f3f5ef",borderRadius:7}}>
              <p style={{fontWeight:750,margin:"0 0 10px"}}>{supplier.provider} supplier details retrieved</p>
              <p style={subdued}>Supplier variants: <strong>{supplier.sourceVariantCount??0}</strong> · Minimum quantity: <strong>{supplier.minimumQuantity??"Not specified"}</strong> · Product available: <strong>{supplier.available===true?"Yes":supplier.available===false?"No":"Not confirmed"}</strong></p>
              {(() => {
                const normalized=specs.toLowerCase().replace(/[^a-z0-9]+/g,"");
                const match=normalized?supplier.variants?.filter(v=>
                  (v.label+" "+v.options.map(o=>o.value).join(" ")).toLowerCase().replace(/[^a-z0-9]+/g,"").includes(normalized)
                ):[];
                return <div>
                  <p style={{...subdued,fontWeight:750}}>{match?.length?"Possible SKU matches for "+specs:"No confirmed SKU match for "+specs}</p>
                  {(match?.length?match:supplier.variants?.slice(0,8)||[]).slice(0,12).map(v=>
                    <p key={v.skuCode} style={{...subdued,borderBottom:"1px solid #dce3d8",paddingBottom:9}}>
                      <strong>{v.label}</strong> · {v.priceCNY!=null?"¥"+v.priceCNY.toFixed(2):"Price unavailable"} · {v.stock!=null?v.stock+" in stock":"Stock unknown"}
                      <br/>Supplier SKU: <code>{v.skuCode}</code>
                    </p>)}
                </div>;
              })()}
              <p style={{...subdued,fontSize:12}}>{supplier.note}</p>
            </div>}
          </section>
          {error&&<p role="alert" style={{color:"#9b2d27",fontSize:14,marginTop:18}}>{error}</p>}
        </>}
      </div>
    </div>
  </section>;
}
