"use client";
import {useState} from "react";
import Link from "next/link";
import {useCart} from "@/components/CartProvider";
import type {SavedFind} from "@/lib/sourcing-workspace-model";
export default function SaveFind({find}:{find:Omit<SavedFind,"folder">}){
 const {account}=useCart();const [state,setState]=useState(""),[busy,setBusy]=useState(false);
 if(!find.url)return null;
 if(account.status!=="authenticated")return <Link className="hc-save-find" href={"/account?next="+encodeURIComponent(find.path)}>Save product</Link>;
 async function save(){setBusy(true);setState("");try{const r=await fetch("/api/account/saved",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save",...find})});const d=await r.json();if(!r.ok)throw Error(d.error);setState("Saved");}catch(e){setState(e instanceof Error?e.message:"Unable to save.");}finally{setBusy(false);}}
 return <span className="hc-save-wrap"><button type="button" className="hc-save-find" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":state==="Saved"?"Saved ✓":"Save product"}</button>{state==="Saved"?<Link href="/saved">View saved</Link>:state&&<small role="status">{state}</small>}</span>;
}
