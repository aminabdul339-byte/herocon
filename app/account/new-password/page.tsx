"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
export default function NewPasswordPage(){
 const [password,setPassword]=useState(""),[working,setWorking]=useState(false),[message,setMessage]=useState("");
 async function update(e:React.FormEvent){
  e.preventDefault();setWorking(true);setMessage("");
  try{
   const r=await fetch("/api/account/password",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({password}),cache:"no-store"
   });
   const d=await r.json();
   if(!r.ok)throw Error(d.error||"Password update failed.");
   setMessage("Your password has been updated. You can now sign in to Herocon.");
   setPassword("");
  }catch(e){setMessage(e instanceof Error?e.message:"Password reset unavailable.");}
  finally{setWorking(false);}
 }
 return <main className="hc-account-page"><Header/><section className="hc-account-shell" style={{display:"block",maxWidth:560}}>
  <h1 style={{font:"400 50px/1.1 Georgia,serif"}}>Choose a new password.</h1>
  <p>Use the secure password-reset link from your account email.</p>
  <form onSubmit={update}>
   <label>New password (at least 12 characters)<input type="password" required minLength={12} maxLength={128}
    value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"
    style={{display:"block",width:"100%",padding:14,margin:"14px 0"}}/></label>
   <button type="submit" disabled={working}>{working?"Updating…":"Update password"}</button>
  </form>
  {message&&<p role="status">{message}</p>}
  <p><Link href="/account">Return to your account <ArrowIcon direction="right"/></Link></p>
 </section></main>;
}
