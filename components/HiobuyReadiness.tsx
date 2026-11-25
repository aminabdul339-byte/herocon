"use client";
import {useState} from "react";
type Check={ok:boolean;status:number;code:string|null};
type Result={wallet:Check&{availableCny:number|null};shipping:Check;checkedAt:string};
export default function HiobuyReadiness(){
 const [busy,setBusy]=useState(false),[result,setResult]=useState<Result|null>(null),[error,setError]=useState("");
 async function run(){setBusy(true);setError("");try{const r=await fetch("/api/hiobuy/readiness",{method:"POST",cache:"no-store"});const data=await r.json();if(!r.ok)throw Error(data.error||"Check failed.");setResult(data);}catch(e){setError(e instanceof Error?e.message:"Check failed.");}finally{setBusy(false);}}
 return <section style={{border:"1px solid #d9e2d6",borderRadius:16,padding:24,background:"#fffefa"}}><h2>Fulfilment connectivity</h2><p>Check warehouse wallet access and UK shipping channel access. This makes two read-only HioBuy API requests. No order, payment or shipment is created. Provider quota may apply.</p><button className="sc-button sc-button-dark" onClick={run} disabled={busy}>{busy?"Checking…":"Check HioBuy connection"}</button>{error&&<p role="alert">{error}</p>}{result&&<div role="status" style={{marginTop:18}}><p><strong>Wallet:</strong> {result.wallet.ok?"Accessible":result.wallet.code} {result.wallet.availableCny!==null?" · ¥"+result.wallet.availableCny.toFixed(2)+" available":""}</p><p><strong>UK shipping API:</strong> {result.shipping.ok?"Accessible":result.shipping.code}</p><p>Checked {new Date(result.checkedAt).toLocaleString()}. API access alone does not confirm a funded wallet, shipping eligibility or live checkout readiness.</p></div>}</section>;
}
