"use client";
import {useEffect,useMemo,useState} from "react";

type ParcelKind="clothing"|"general"|"cosmetics"|"battery";
type Billing="actual"|"greater"|"ems";
type RateExample={
 id:string;
 title:string;
 description:string;
 days:string;
 sampleUSD:number;
 sampleKg:number;
 billing:Billing;
 divisor?:number;
 minimumKg?:number;
 incrementKg:number;
 maxSorted?:[number,number,number];
 maxLongest?:number;
 maxSecond?:number;
 maxGirth?:number;
 kinds:ParcelKind[];
 conditions:string;
};
type Estimate={route:RateExample;billedKg:number;volumeKg:number;usd:number};

const EXAMPLE_ROUTES:RateExample[]=[
 {id:"uk-clothing",title:"UK Clothing Line",description:"Light clothing parcels without boxes",days:"10–15 days",sampleUSD:18.45,sampleKg:1.4,billing:"actual",incrementKg:0.1,kinds:["clothing"],conditions:"Clothing only; remove boxes and use soft bag packaging. Confirm acceptance of your items."},
 {id:"uk-fast-actual",title:"UK Fast Line · Actual Weight",description:"Air delivery calculated by actual weight",days:"10–15 days",sampleUSD:21.75,sampleKg:1.5,billing:"actual",minimumKg:1.5,incrementKg:0.1,maxSorted:[55,40,35],kinds:["clothing","general"],conditions:"Example maximum packed dimensions: 55 × 40 × 35 cm. Carrier restrictions still apply."},
 {id:"uk-taxfree-ph",title:"UK Tax-Free · Actual Weight",description:"Illustrative actual-weight parcel option",days:"8–13 days",sampleUSD:21.0,sampleKg:1.5,billing:"actual",minimumKg:1.5,incrementKg:0.1,maxSorted:[55,40,35],kinds:["clothing","general"],conditions:"Example parcel limit: 55 × 40 × 35 cm. Tax treatment is not guaranteed by Herocon."},
 {id:"uk-taxfree-actual",title:"UK Tax-Free Line · Actual Weight",description:"Another actual-weight reference option",days:"10–15 days",sampleUSD:24.9,sampleKg:1.5,billing:"actual",minimumKg:1.5,incrementKg:0.1,maxLongest:60,maxSecond:45,kinds:["clothing","general"],conditions:"Longest side under 60 cm; second-longest side under 45 cm. Taxes are not included in this model."},
 {id:"ems-cy",title:"EMS Postal Line",description:"Post-style reference route",days:"15–26 days",sampleUSD:34.2,sampleKg:1.5,billing:"ems",divisor:6000,minimumKg:1.5,incrementKg:0.1,maxGirth:274,kinds:["clothing","general"],conditions:"Under 60 cm longest side uses actual weight in this sample; larger parcels use the greater of actual and volumetric weight. Length + 2 × (width + height) must be at most 274 cm."},
 {id:"uk-fast-volume",title:"UK Fast Line · Volumetric",description:"Air delivery billed on higher weight",days:"10–15 days",sampleUSD:42,sampleKg:3.4,billing:"greater",divisor:8000,incrementKg:0.1,maxSorted:[55,40,35],kinds:["clothing","general"],conditions:"Reference parcel limit: 55 × 40 × 35 cm. Volumetric weight is L × W × H ÷ 8,000, in kilograms."},
 {id:"royal-mail-d",title:"Royal Mail-D Reference",description:"Standard parcel line billed on higher weight",days:"18–25 days",sampleUSD:49.65,sampleKg:3.4,billing:"greater",divisor:8000,incrementKg:0.1,maxLongest:60,maxSecond:40,kinds:["clothing","general"],conditions:"Longest side under 60 cm and second-longest under 40 cm. Timing and pricing are illustrative."},
 {id:"cosmetics-air",title:"Cosmetics Air Express",description:"Reference route for beauty goods or electronics",days:"12–19 days",sampleUSD:52.2,sampleKg:3.4,billing:"greater",divisor:8000,incrementKg:0.1,maxLongest:60,maxSecond:40,kinds:["cosmetics"],conditions:"Example allows some cosmetics and electronic goods, subject to individual item acceptance. Volumetric divisor: 8,000."},
 {id:"special-cargo",title:"UK Express · Special Cargo",description:"Example specialist route for battery-related parcels",days:"15–28 days",sampleUSD:65.7,sampleKg:3.4,billing:"greater",divisor:8000,incrementKg:0.1,maxSorted:[60,50,40],kinds:["battery"],conditions:"The source example lists a special-cargo service; actual battery eligibility needs carrier confirmation. Volumetric divisor: 8,000."},
 {id:"ups-express",title:"UPS (HK) Express Reference",description:"Faster international express example",days:"7–12 days",sampleUSD:120,sampleKg:5.5,billing:"greater",divisor:5000,incrementKg:0.5,maxLongest:119,maxSecond:73,maxGirth:294,kinds:["clothing","general","cosmetics"],conditions:"Volumetric divisor: 5,000. Reference parcel restrictions and possible remote-area surcharges apply. Customs charges may be payable."}
];
const gbp=new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"});
const usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
const roundWeight=(kg:number,increment:number)=>Math.ceil((kg-0.00000001)/increment)*increment;
const fmtWeight=(kg:number)=>Number(kg.toFixed(2)).toLocaleString("en-GB",{maximumFractionDigits:2})+" kg";

export default function ShippingEstimator(){
 const [country,setCountry]=useState("GB");
 const [parcelKind,setParcelKind]=useState<ParcelKind>("clothing");
 const [weight,setWeight]=useState("1400");
 const [length,setLength]=useState("30");
 const [width,setWidth]=useState("30");
 const [height,setHeight]=useState("30");
 const [fx,setFx]=useState<{rate:number;date:string}|null>(null);
 const [fxError,setFxError]=useState(false);

 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/fx/usd-gbp",{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw new Error("GBP rate unavailable");return response.json();})
   .then(data=>{
    if(controller.signal.aborted)return;
    if(typeof data.rate!=="number"||!Number.isFinite(data.rate)||data.rate<=0.01||data.rate>=1||typeof data.date!=="string")throw new Error("Invalid exchange rate");
    setFx({rate:data.rate,date:data.date});
   })
   .catch(()=>{if(!controller.signal.aborted)setFxError(true);});
  return ()=>controller.abort();
 },[]);

 const w=Number(weight),l=Number(length),wd=Number(width),h=Number(height);
 const valid=[w,l,wd,h].every(v=>Number.isFinite(v)&&v>0)&&w<=60000&&[l,wd,h].every(v=>v<=200);
 const volumeCm3=l*wd*h;
 const actualKg=w/1000;
 const sizes=[l,wd,h].sort((a,b)=>b-a);
 const estimates=useMemo<Estimate[]>(()=>{
  if(!valid||country!=="GB")return [];
  return EXAMPLE_ROUTES.filter(route=>{
   if(!route.kinds.includes(parcelKind))return false;
   if(route.maxSorted&&sizes.some((side,i)=>side>route.maxSorted![i]))return false;
   if(route.maxLongest&&sizes[0]>=route.maxLongest)return false;
   if(route.maxSecond&&sizes[1]>=route.maxSecond)return false;
   if(route.maxGirth&&sizes[0]+2*(sizes[1]+sizes[2])>route.maxGirth)return false;
   return true;
  }).map(route=>{
   const volumeKg=route.divisor?volumeCm3/route.divisor:0;
   const usesVolume=route.billing==="greater"||(route.billing==="ems"&&sizes[0]>=60);
   const rawKg=Math.max(route.minimumKg||0,usesVolume?Math.max(actualKg,volumeKg):actualKg);
   const billedKg=roundWeight(rawKg,route.incrementKg);
   // Reference illustration: scale one published sample price proportionally
   // to billable weight. This is NOT a carrier tariff or guaranteed rate.
   return {route,billedKg,volumeKg,usd:route.sampleUSD*billedKg/route.sampleKg};
  }).filter(result=>result.billedKg<=30).sort((a,b)=>a.usd-b.usd);
 },[valid,country,parcelKind,actualKg,volumeCm3,l,wd,h]);


 return <section className="hc-shipping-estimator" aria-labelledby="hc-shipping-title">
  <div className="hc-shipping-heading">
   <div><p className="sc-kicker">SHIPPING FEE ESTIMATION</p><h2 id="hc-shipping-title">Compare estimated <em>shipping costs.</em></h2>
    <p>Check different parcel-shipping examples by weight, size, product type and destination. See how billing weight changes the cost.</p></div>
   <div className="hc-shipping-reference-label">Reference estimates · Not live carrier rates</div>
  </div>
  <div className="hc-shipping-inputs">
   <div className="hc-shipping-field hc-shipping-country"><label htmlFor="hc-shipping-country">Deliver to</label><select id="hc-shipping-country" value={country} onChange={e=>{setCountry(e.target.value);}}>
     <option value="GB">United Kingdom</option><option value="US">United States</option><option value="DE">Germany</option><option value="FR">France</option><option value="AU">Australia</option><option value="CA">Canada</option><option value="OTHER">Other destination</option>
    </select></div>
   <div className="hc-shipping-field hc-shipping-kind"><label htmlFor="hc-shipping-kind">Parcel contents</label><select id="hc-shipping-kind" value={parcelKind} onChange={e=>{setParcelKind(e.target.value as ParcelKind);}}>
     <option value="clothing">Clothing (without boxes)</option><option value="general">General merchandise</option><option value="cosmetics">Cosmetics or electronics</option><option value="battery">Battery-related goods</option>
    </select></div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-weight">Actual weight (g)</label><input id="hc-shipping-weight" inputMode="decimal" type="number" min="1" max="60000" step="any" value={weight} onChange={e=>{setWeight(e.target.value);}}/></div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-length">Length (cm)</label><input id="hc-shipping-length" inputMode="decimal" type="number" min="1" max="200" step="any" value={length} onChange={e=>{setLength(e.target.value);}}/></div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-width">Width (cm)</label><input id="hc-shipping-width" inputMode="decimal" type="number" min="1" max="200" step="any" value={width} onChange={e=>{setWidth(e.target.value);}}/></div>
   <div className="hc-shipping-field"><label htmlFor="hc-shipping-height">Height (cm)</label><input id="hc-shipping-height" inputMode="decimal" type="number" min="1" max="200" step="any" value={height} onChange={e=>{setHeight(e.target.value);}}/></div>
   <button className="hc-shipping-example" type="button" onClick={()=>{setCountry("GB");setParcelKind("clothing");setWeight("1400");setLength("30");setWidth("30");setHeight("30");}}>Reset to example values ↺</button>
  </div>
  
  {!valid?<div className="hc-shipping-empty" role="status">Enter a valid parcel weight (up to 60,000 g) and dimensions (up to 200 cm per side) to see the comparison.</div>:
   country!=="GB"?<div className="hc-shipping-empty" role="status"><strong>Shipping examples are available for the UK only.</strong><p>Shipping comparisons for this destination are not available yet.</p></div>:
   estimates.length===0?<div className="hc-shipping-empty" role="status"><strong>No matching reference routes.</strong><p>These example services may not accept the selected parcel type, weight or dimensions. Change your parcel details to compare the examples, or request a real quote from a carrier.</p></div>:
   <>
    <div className="hc-shipping-comparison-top"><div><h3>Available reference comparisons</h3><p>{estimates.length} illustrative routes · Actual parcel weight: {fmtWeight(actualKg)} · Cheapest shown first</p></div><span>{fx?"GBP conversion: "+fx.date:fxError?"GBP conversion temporarily unavailable":"Converting USD prices to GBP…"}</span></div>
    <div className="hc-shipping-route-list">
     {estimates.map((entry,index)=>{const {route,billedKg,volumeKg,usd:priceUSD}=entry;const priceGBP=fx?priceUSD*fx.rate:null;
      return <article key={route.id} className="hc-shipping-route">
       <div className="hc-route-main"><div className="hc-route-identity"><span className="hc-route-overline">{index===0?"LOWEST REFERENCE ESTIMATE":"SHIPPING REFERENCE"}</span><h4>{route.title}</h4><p>{route.description}</p></div>
        <div className="hc-route-measure"><small>Chargeable weight</small><strong>{fmtWeight(billedKg)}</strong><small>Delivery estimate</small><strong>{route.days}</strong></div>
        <div className="hc-route-price"><strong>{priceGBP!=null?"≈ "+gbp.format(priceGBP):"≈ "+usd.format(priceUSD)}</strong><small>{priceGBP!=null?"≈ "+usd.format(priceUSD)+" (modelled)":fxError?"USD reference estimate":"Loading GBP estimate…"}</small></div>
       </div>
       <details className="hc-route-details"><summary>See billing method & restrictions</summary><p><strong>Billing:</strong> {route.billing==="actual"?"Actual weight":route.billing==="ems"?"Actual weight for lengths under 60 cm, otherwise higher of actual and volumetric":"Higher of actual and volumetric weight"}{route.divisor?" (L × W × H ÷ "+route.divisor.toLocaleString("en-GB")+")":""}.</p>
        {route.divisor!=null&&<p><strong>Calculated volumetric weight:</strong> {volumeKg.toFixed(2)} kg</p>}
        <p><strong>Reference restrictions:</strong> {route.conditions}</p>
        <p><strong>Pricing basis:</strong> {usd.format(route.sampleUSD)} at {fmtWeight(route.sampleKg)} in the reference example, adjusted for the parcel weight. Confirm the final price with the shipping provider.</p>
       </details>
      </article>;
     })}
    </div>
   </>
  }
  <p className="hc-shipping-footnote">Delivery times are reference ranges only, not guaranteed. A volumetric calculation may increase the billed weight above the actual scale weight. Confirm packed dimensions, current carrier eligibility and the final payable price before ordering.</p>
 </section>;
}
