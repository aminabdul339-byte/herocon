"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import {Suspense,useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import Header from "@/components/Header";
import AccountTrialCountdown from "@/components/AccountTrialCountdown";
import {useCart,PENDING_CART_KEY,cartStorageKey,type CartItem} from "@/components/CartProvider";

type Mode="signup"|"login"|"recover";
type AuthResult={ok?:boolean;authenticated?:boolean;requiresConfirmation?:boolean;message?:string;error?:string};
const inputStyle:React.CSSProperties={display:"block",width:"100%",padding:"14px 15px",border:"1px solid #c7d5c4",borderRadius:6,background:"#fff",marginTop:7,fontSize:15};
const buttonStyle:React.CSSProperties={border:0,borderRadius:6,padding:"14px 24px",background:"#264a32",color:"#fff",fontWeight:750,width:"100%",cursor:"pointer"};
function safeNext(value:string|null){
 if(!value||value.length>350||!value.startsWith("/")||value.startsWith("//")||/[\\\r\n]/.test(value))return null;
 return value;
}
function savePendingSelection(userId:string){
 try{
  const raw=localStorage.getItem(PENDING_CART_KEY);
  if(!raw)return false;
  localStorage.removeItem(PENDING_CART_KEY);
  const d=JSON.parse(raw) as {version?:number;rows?:CartItem[];requestedAt?:number};
  if(d.version!==1||typeof d.requestedAt!=="number"||Date.now()-d.requestedAt>30*60*1000||
   !Array.isArray(d.rows)||d.rows.length>20)return false;
  const key=cartStorageKey(userId);
  const previous:unknown=JSON.parse(localStorage.getItem(key)||"[]");
  const existing:CartItem[]=Array.isArray(previous)?previous.filter(v=>
   v&&typeof v==="object"&&typeof v.key==="string"&&typeof v.quantity==="number").slice(0,100):[];
  const byKey=new Map(existing.map(item=>[item.key,item]));
  for(const item of d.rows){
   if(!item||typeof item.key!=="string"||item.key.length>1200||
    typeof item.marketplaceUrl!=="string"||!item.marketplaceUrl.startsWith("https://")||
    typeof item.quantity!=="number"||!Number.isInteger(item.quantity)||item.quantity<1||
    !["CNY","GBP"].includes(item.currency))continue;
   const nextQuantity=Math.max(1,Math.min(999,item.quantity));
   const old=byKey.get(item.key);
   if(old)byKey.set(item.key,{...item,quantity:Math.min(999,old.quantity+nextQuantity),selected:true});
   else if(byKey.size<100)byKey.set(item.key,{...item,quantity:nextQuantity,selected:true});
  }
  localStorage.setItem(key,JSON.stringify([...byKey.values()]));
  return true;
 }catch{return false;}
}
function AccountContent(){
 const search=useSearchParams();
 const next=safeNext(search.get("next"));
 const [mode,setMode]=useState<Mode>(search.get("mode")==="login"?"login":"signup");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirmPassword,setConfirmPassword]=useState("");
 const [working,setWorking]=useState(false),[notice,setNotice]=useState("");
 const [readyToConfirm,setReadyToConfirm]=useState(false);
 const [verificationCode,setVerificationCode]=useState("");
 const {account}=useCart();
 const pending=useMemo(()=>Boolean(next),[next]);
 useEffect(()=>{
  if(search.get("error")==="confirmation")setNotice("That confirmation link has expired or could not be verified. Please request another email.");
  else if(search.get("confirmed")==="1")setNotice("Your email is confirmed. You can now use your free Herocon account.");
 },[search]);
 useEffect(()=>{
  if(account.status!=="authenticated"||!account.id||!next)return;
  savePendingSelection(account.id);
  window.location.replace(next);
 },[account.status,account.id,next]);
 async function handleSubmit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(working)return;
  if(mode==="signup"&&password!==confirmPassword){setNotice("Passwords do not match.");return;}
  setWorking(true);setNotice("");setReadyToConfirm(false);
  try{
   const response=await fetch("/api/account/auth",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode,email,password,...(mode==="signup"?{confirmPassword}:{})}),
    credentials:"same-origin",cache:"no-store"
   });
   const result=await response.json() as AuthResult;
   if(!response.ok)throw Error(result.error||"The account service could not complete this request.");
   if(mode==="recover"){setNotice(result.message||"If the address has an account, reset instructions have been sent.");return;}
   if(result.requiresConfirmation){
    setReadyToConfirm(true);setPassword("");setConfirmPassword("");setVerificationCode("");
    setNotice(result.message||"Check your inbox and confirm your email before signing in.");
    return;
   }
   const session=await fetch("/api/account/session",{cache:"no-store",credentials:"same-origin"});
   const data=await session.json();
   if(!session.ok||data.authenticated!==true||typeof data.user?.id!=="string")
    throw Error("Please verify your email address and sign in to finish.");
   savePendingSelection(data.user.id);
   window.location.assign(next||"/cart");
  }catch(error){setNotice(error instanceof Error?error.message:"The account service is temporarily unavailable.");}
  finally{setWorking(false);}
 }
 async function verifySignup(resend=false){
  if(working)return;setWorking(true);setNotice("");
  try{
   const response=await fetch("/api/account/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:resend?"resend":"verify",email,code:verificationCode}),credentials:"same-origin",cache:"no-store"});
   const result=await response.json() as AuthResult;
   if(!response.ok)throw Error(result.error||"Verification could not be completed.");
   if(resend){setNotice(result.message||"Verification email requested. Check your inbox and spam folder.");return;}
   const session=await fetch("/api/account/session",{cache:"no-store",credentials:"same-origin"});const data=await session.json();
   if(!session.ok||!data.authenticated||!data.user?.id)throw Error("Sign in to finish verification.");
   savePendingSelection(data.user.id);window.location.assign(next||"/account");
  }catch(e){setNotice(e instanceof Error?e.message:"Verification unavailable.");}finally{setWorking(false);}
 }
 async function logout(){
  setWorking(true);
  try{await fetch("/api/account/logout",{method:"POST",credentials:"same-origin"});}
  finally{window.location.assign("/account");}
 }
 return <main className="hc-account-page">
  <Header/>
  <section className="hc-account-shell">
   <div className="hc-account-intro">
    <h1>{account.status==="authenticated"?"Your account":"Welcome to Herocon"}</h1>
    <p>{account.ownerPremium?"Your complimentary Premium access is active.":"Explore Chinese marketplaces, discover new products and keep your finds together."}</p>
    {account.ownerPremium?<div className="hc-account-offer"><strong>Owner Premium</strong><span>Full catalogue and private testing workspace.</span></div>:account.status!=="authenticated"?<div className="hc-account-offer"><div className="hc-account-offer-top"><strong>Try Premium free</strong><span>3 days</span></div><p>Full catalogue and available search tools. No card or automatic renewal.</p><Link href="/membership/trial">Start free trial <ArrowIcon direction="right"/></Link></div>:null}
    {account.status!=="authenticated"&&<Link className="hc-account-plan-link" href="/membership">Compare membership plans <ArrowIcon direction="right"/></Link>}
    {pending&&<p className="hc-account-pending">Your selected product will be saved after sign-in.</p>}
   </div>
   <div className="hc-account-card">
    {account.status==="authenticated"&&!next?<>
     <div className="hc-account-status-heading"><h2>My account</h2><span>Verified</span></div>
     <p className="hc-account-email-address">{account.email}</p>
     {account.ownerPremium?<div className="hc-account-membership-state"><strong>Owner Premium</strong><p>Complimentary access. No recurring charge.</p></div>:account.trialEndsAt?<AccountTrialCountdown key={account.trialEndsAt} endsAt={account.trialEndsAt} clockOffsetMs={account.clockOffsetMs??0}/>:account.premium?<div className="hc-account-membership-state"><strong>Premium</strong><p>Full catalogue and available sourcing tools.</p></div>:<div className="hc-account-membership-state"><strong>Free membership</strong><p>Explore Premium for more access.</p></div>}
     <div className="hc-account-member-actions">
      <Link href={account.trialEndsAt?"/membership/trial":account.premium?"/membership/activate":"/membership"}>{account.trialEndsAt?"View trial":account.premium?"Manage membership":"Explore membership"} <ArrowIcon direction="right"/></Link>
      {account.trialEndsAt&&<Link href="/membership/activate">Upgrade to Premium <ArrowIcon direction="right"/></Link>}
      {account.ownerPremium&&<Link href="/owner/hiobuy">HioBuy fulfilment setup <ArrowIcon direction="right"/></Link>}
      <Link href="/account/new-password">Set or change password <ArrowIcon direction="right"/></Link>
      <button type="button" onClick={logout} disabled={working} className="hc-account-secondary">{working?"Signing out…":"Log out"}</button>
     </div>
    </>:account.status==="unavailable"?<>
     <p className="hc-premium-kicker">ACCOUNT SETUP</p>
     <h2>Sign-in unavailable.</h2>
     <p>Please try again shortly or contact support.</p>
     <Link className="hc-account-primary-link" href="/search">Continue browsing <ArrowIcon direction="right"/></Link>
    </>:account.status==="authenticated"&&next?<>
     <h2>Opening your cart…</h2>
    </>:<>
     <div className="hc-account-tabs">
      <button type="button" className={mode==="signup"?"active":""} onClick={()=>{setMode("signup");setPassword("");setConfirmPassword("");setNotice("");setReadyToConfirm(false);}}>Create account</button>
      <button type="button" className={mode==="login"?"active":""} onClick={()=>{setMode("login");setPassword("");setConfirmPassword("");setNotice("");setReadyToConfirm(false);}}>Sign in</button>
     </div>
     <h2>{readyToConfirm?"Verify your email":mode==="signup"?"Create account":mode==="login"?"Sign in":"Reset password"}</h2>
     <p>{readyToConfirm?"Enter the code from your email, or open the confirmation link.":mode==="signup"?"Free to join.":mode==="login"?"Access your Herocon account.":"We’ll send reset instructions if this email has an account."}</p>
     {readyToConfirm?<form onSubmit={e=>{e.preventDefault();void verifySignup();}}><label>Email<input type="email" value={email} readOnly style={inputStyle}/></label><label>Verification code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required value={verificationCode} onChange={e=>setVerificationCode(e.target.value.replace(/[^0-9]/g,""))} style={inputStyle}/></label><button type="submit" style={buttonStyle} disabled={working||!/^\d{6,10}$/.test(verificationCode)}>Verify email</button><div className="hc-account-verify-actions"><button type="button" className="hc-account-text-button" disabled={working} onClick={()=>void verifySignup(true)}>Resend email</button><button type="button" className="hc-account-text-button" onClick={()=>{setReadyToConfirm(false);setNotice("");setVerificationCode("");}}>Change email</button></div></form>:<form onSubmit={handleSubmit}>
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/></label>
      {mode!=="recover"&&<label>Password<input type="password" required minLength={mode==="signup"?8:undefined} maxLength={128} autoComplete={mode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/>{mode==="signup"&&<small>At least 8 characters. A longer, unique password is recommended.</small>}</label>}
      {mode==="signup"&&<label>Confirm password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={inputStyle}/>{confirmPassword&&password!==confirmPassword&&<small role="status">Passwords do not match.</small>}</label>}
      <button type="submit" disabled={working||account.status==="checking"} style={buttonStyle}>
       {working?"Please wait…":mode==="signup"?"Create free account":mode==="login"?"Sign in":"Send password-reset email"}
      </button>
     </form>}
     {mode==="login"?<button type="button" className="hc-account-text-button" onClick={()=>{setMode("recover");setNotice("");}}>Forgot your password?</button>:mode==="recover"?<button type="button" className="hc-account-text-button" onClick={()=>setMode("login")}>Back to sign in</button>:null}
     {notice&&<p role="status" className="hc-account-notice">{notice}</p>}
     {readyToConfirm&&<p className="hc-account-fine">If the email contains a link instead, open it in this browser. Check your spam folder if nothing arrives.</p>}
     {!readyToConfirm&&<Link href="/membership/trial" className="hc-account-email-link">Try Premium for 3 days <ArrowIcon direction="right"/></Link>}
     <p className="hc-account-fine">By creating an account you agree to our <Link href="/terms-and-conditions">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</p>
    </>}
   </div>
  </section>
 </main>;
}
export default function AccountPage(){
 return <Suspense fallback={<main className="hc-account-page"><Header/><section className="hc-account-shell"><p>Loading account…</p></section></main>}><AccountContent/></Suspense>;
}
