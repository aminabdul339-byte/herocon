"use client";
import {useRef,useState} from "react";
type ParcelKind="clothing"|"general"|"cosmetics"|"battery";
type ShippingRate={
 serviceCode:string;name:string;provider:string|null;amount:number|null;
 currency:"CNY"|null;approxGBP:number|null;estimatedDays:string|null;
 billedKg:number|null;actualKg:number|null;available:boolean|null;
 reason:string|null;risks:number[];notices:string[];taxNote:string|null
};
type QuoteResponse={rates:ShippingRate[];total:number|null;returned:number;quotedAt:string;currencyWarning:string|null;fxDate:string|null};
const CURRENCY=new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"});
export default function ShippingEstimator(){
 const [country,setCountry]=useState("GB");
 const [kind,setKind]=useState<ParcelKind>("clothing");
 const [grams,setGrams]=useState("1400");
 const [length,setLength]=useState("30");
 const [width,setWidth]=useState("30");
 const [height,setHeight]=useState("30");
 const [postCode,setPostCode]=useState("");
 const [quote,setQuote]=useState<QuoteResponse|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const lastRequest=useRef(0);
 const reset=()=>{lastRequest.current++;setQuote(null);setError("");setLoading(false);};
 const values=[Number(length),Number(width),Number(height)];
 const gramValue=Number(grams);
 const valid=Number.isInteger(gramValue)&&gramValue>=1&&gramValue<=60000&&values.every(n=>Number.isFinite(n)&&n>0&&n<=200&&Math.round(n*100)===n*100)&&postCode.length<=10;
 async function getQuotes(){
  if(!valid||loading)return;
  const id=++lastRequest.current;
  setLoading(true);setError("");setQuote(null);
  try{
   const response=await fetch("/api/buckydrop/shipping-quote",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({country,kind,grams:gramValue,length:values[0],width:values[1],height:values[2],postCode:postCode.trim()}),cache:"no-store"
   });
   const data=await response.json();
   if(id!==lastRequest.current)return;
   if(!response.ok)throw Error(typeof data.error==="string"?data.error:"Shipping estimates are unavailable.");
   if(!Array.isArray(data.rates))throw Error("The shipping provider returned an invalid quote.");
   setQuote(data as QuoteResponse);
  }catch(e){if(id===lastRequest.current)setError(e instanceof Error?e.message:"Could not retrieve shipping quotes.");}
  finally{if(id===lastRequest.current)setLoading(false);}
 }
 const resetForm=()=>{reset();setCountry("GB");setKind("clothing");setGrams("1400");setLength("30");setWidth("30");setHeight("30");setPostCode("");};
 return <section className="hc-shipping-estimator" aria-labelledby="hc-shipping-title">
  <div className="hc-shipping-heading">
   <div><p className="sc-kicker">SHIPPING FEE ESTIMATION</p><h2 id="hc-shipping-title">Compare <em>shipping options.</em></h2>
    <p>Check available delivery routes and indicative shipping prices with our fulfilment partner in China. Enter your parcel details to request a quotation.</p></div>
   <span className="hc-shipping-reference-label">Partner delivery estimates</span>
  </div>
  <div className="hc-shipping-inputs">
   <div className="hc-shipping-field hc-shipping-country"><label htmlFor="hc-shipping-country">Deliver to</label>
    <select id="hc-shipping-country" value={country} onChange={e=>{reset();setCountry(e.target.value);}}>
     {[["GB","United Kingdom"],["US","United States"],["DE","Germany"],["FR","France"],["CA","Canada"],["AU","Australia"],["IE","Ireland"],["NL","Netherlands"],["ES","Spain"],["IT","Italy"],["BE","Belgium"],["SE","Sweden"],["NO","Norway"],["DK","Denmark"],["CH","Switzerland"],["NZ","New Zealand"]].map(([code,name])=><option key={code} value={code}>{name}</option>)}
    </select>
   </div>
   <div className="hc-shipping-field hc-shipping-kind"><label htmlFor="hc-shipping-kind">Parcel contents</label>
    <select id="hc-shipping-kind" value={kind} onChange={e=>{reset();setKind(e.target.value as ParcelKind);}}>
     <option value="clothing">Clothing</option><option value="general">General merchandise</option><option value="cosmetics">Cosmetics or electronics</option><option value="battery">Battery-related goods</option>
    </select>
   </div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-grams">Actual weight (g)</label><input id="hc-shipping-grams" type="number" min="1" max="60000" step="1" inputMode="numeric" value={grams} onChange={e=>{reset();setGrams(e.target.value);}}/></div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-length">Length (cm)</label><input id="hc-shipping-length" type="number" min=".01" max="200" step=".01" value={length} onChange={e=>{reset();setLength(e.target.value);}}/></div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-width">Width (cm)</label><input id="hc-shipping-width" type="number" min=".01" max="200" step=".01" value={width} onChange={e=>{reset();setWidth(e.target.value);}}/></div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-height">Height (cm)</label><input id="hc-shipping-height" type="number" min=".01" max="200" step=".01" value={height} onChange={e=>{reset();setHeight(e.target.value);}}/></div>
   <div className="hc-shipping-field hc-shipping-postcode"><label htmlFor="hc-shipping-postcode">Postcode (optional)</label><input id="hc-shipping-postcode" type="text" maxLength={10} value={postCode} onChange={e=>{reset();setPostCode(e.target.value);}} placeholder="e.g. SW1A 1AA"/></div>
   <div className="hc-shipping-submit"><button type="button" className="sc-button sc-button-dark" disabled={!valid||loading} onClick={getQuotes}>{loading?"Checking available routes…":"Get shipping quotes ↗"}</button>
    <button type="button" className="hc-shipping-example" onClick={resetForm}>Reset values ↺</button></div>
  </div>
  {!valid&&<p className="hc-shipping-error" role="status">Please enter a weight between 1 g and 60 kg and dimensions between 0 and 200 cm.</p>}
  {error&&<div className="hc-shipping-error" role="alert">{error}</div>}
  {quote&&<>
   <div className="hc-shipping-comparison-top"><div><h3>Shipping options</h3><p>{quote.returned} provider routes returned · Quoted {new Date(quote.quotedAt).toLocaleString("en-GB")}</p></div><span>Costs are estimates, not booked shipments</span></div>
   {quote.currencyWarning&&<p className="hc-shipping-currency-alert" role="status">Shipping quote amounts are shown without a currency symbol until our partner&apos;s billing currency is confirmed. They are not payable checkout prices.</p>}
   {quote.rates.length===0?<div className="hc-shipping-empty">The provider returned no shipping options for this parcel. Check the parcel details or try another destination.</div>:
    <div className="hc-shipping-route-list">{quote.rates.map((route,i)=><article className="hc-shipping-route" key={route.serviceCode+"-"+i}>
     <div className="hc-route-main">
      <div className="hc-route-identity"><span className="hc-route-overline">{route.available===false?"UNAVAILABLE":route.risks.length?"CHECK RESTRICTIONS":"PROVIDER SHIPPING OPTION"}</span><h4>{route.name}</h4><p>{route.provider||"Delivery service"} · {route.serviceCode}</p></div>
      <div className="hc-route-measure"><small>Chargeable weight</small><strong>{route.billedKg!=null?route.billedKg+" kg":"To be confirmed"}</strong><small>Estimated delivery</small><strong>{route.estimatedDays||"Not provided"}</strong></div>
      <div className="hc-route-price"><strong>{route.amount==null?"Price unavailable":route.approxGBP!=null?"≈ "+CURRENCY.format(route.approxGBP):route.amount.toFixed(2)}</strong><small>{route.currency==="CNY"?"¥"+(route.amount?.toFixed(2)||"")+" CNY · estimated GBP above":"Provider currency unconfirmed"}</small></div>
     </div>
     <details className="hc-route-details"><summary>Delivery details and conditions</summary>
      {route.reason&&<p><strong>Availability:</strong> {route.reason}</p>}
      {!!route.risks.length&&<p><strong>Provider warnings:</strong> {route.risks.includes(1)?"Weight limit may be exceeded. ":""}{route.risks.includes(2)?"Size limit may be exceeded.":""}</p>}
      {route.taxNote&&<p><strong>Tax information:</strong> {route.taxNote}</p>}
      {route.notices.map((note,j)=><p key={j}>{note}</p>)}
      <p>Shipping is subject to the supplier, package checks, insurance, customs rules and final carrier acceptance.</p>
     </details>
    </article>)}</div>}
  </>}
  <p className="hc-shipping-footnote">This is a partner delivery estimate, not a confirmed booking. Weight, dimensions, eligibility and the final amount may change after packing and verification. No shipping purchase or payment takes place through this estimator.</p>
 </section>;
}
