"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./reset.module.css";

function Eye({visible}:{visible:boolean}){
 return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>{visible&&<path d="m3 3 18 18" strokeWidth="2"/>}</svg>;
}
export default function NewPasswordPage(){
 const [password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
 const [show,setShow]=useState(false),[showConfirm,setShowConfirm]=useState(false);
 const [working,setWorking]=useState(false),[message,setMessage]=useState(""),[success,setSuccess]=useState(false);
 const mismatch=confirm.length>0&&confirm!==password;
 async function update(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(working||success)return;
  if(password!==confirm){setMessage("Your passwords do not match.");return;}
  setWorking(true);setMessage("");
  try{
   const r=await fetch("/api/account/password",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({password}),cache:"no-store",credentials:"same-origin"
   });
   const d=await r.json();
   if(!r.ok)throw Error(d.error||"Password update failed.");
   setSuccess(true);setPassword("");setConfirm("");
  }catch(e){setMessage(e instanceof Error?e.message:"Password reset unavailable.");}
  finally{setWorking(false);}
 }
 return <main className="hc-account-page"><Header/>
  <section className={styles.shell} aria-labelledby="reset-heading">
   <Link href="/account" className={styles.back}><ArrowIcon direction="left"/> Back to your account</Link>
   <div className={styles.card}>
    <div className={styles.lock}><svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{success?<path d="m5 12 4 4L19 6"/>:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>}</svg></div>
    <p className={styles.kicker}>ACCOUNT SECURITY</p>
    <h1 id="reset-heading">{success?<>Password <em>updated.</em></>:<>Set a new <em>password.</em></>}</h1>
    <p className={styles.intro}>{success?"Your new password is ready to use. You can return to your account securely.":"Choose a new password to keep your Herocon account secure."}</p>
    {success?<div className={styles.success}><p role="status">Your password has been successfully changed.</p><Link href="/account" className={styles.primary}>Return to your account <ArrowIcon direction="right"/></Link></div>:<>
     <form onSubmit={update} className={styles.form}>
      <div className={styles.field}><label htmlFor="reset-password">New password</label><div className={styles.inputWrap}><input id="reset-password" type={show?"text":"password"} required minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="Enter your new password" aria-describedby="password-hint" disabled={working}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"} aria-pressed={show}><Eye visible={show}/></button></div><p id="password-hint" className={styles.hint}>Use at least 12 characters. A unique password is best.</p></div>
      <div className={styles.field}><label htmlFor="reset-confirm">Confirm new password</label><div className={styles.inputWrap}><input id="reset-confirm" type={showConfirm?"text":"password"} required minLength={12} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" aria-invalid={mismatch} aria-describedby={mismatch?"match-hint":undefined} disabled={working}/><button type="button" onClick={()=>setShowConfirm(!showConfirm)} aria-label={showConfirm?"Hide confirmation password":"Show confirmation password"} aria-pressed={showConfirm}><Eye visible={showConfirm}/></button></div>{mismatch&&<p id="match-hint" className={styles.errorText}>Passwords do not match.</p>}</div>
      {message&&<p role="alert" className={styles.error}>{message}</p>}
      <button className={styles.primary} type="submit" disabled={working||password.length<12||password!==confirm}>{working?"Updating password…":"Update password"}<ArrowIcon direction="right"/></button>
     </form>
     <div className={styles.help}><p>Reset link expired or not working?</p><Link href="/account?mode=login">Request a new password reset</Link></div>
    </>}
   </div>
   <p className={styles.footer}>herocon. <span aria-hidden="true">·</span> Your link to China</p>
  </section>
 </main>;
}
