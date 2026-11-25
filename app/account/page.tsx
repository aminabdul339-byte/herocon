"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import {Suspense,useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import Header from "@/components/Header";
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
 const [mode,setMode]=useState<Mode>("signup");
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [working,setWorking]=useState(false),[notice,setNotice]=useState("");
 const [readyToConfirm,setReadyToConfirm]=useState(false);
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
  setWorking(true);setNotice("");setReadyToConfirm(false);
  try{
   const response=await fetch("/api/account/auth",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode,email,password}),
    credentials:"same-origin",cache:"no-store"
   });
   const result=await response.json() as AuthResult;
   if(!response.ok)throw Error(result.error||"The account service could not complete this request.");
   if(mode==="recover"){setNotice(result.message||"If the address has an account, reset instructions have been sent.");return;}
   if(result.requiresConfirmation){
    setReadyToConfirm(true);
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
 async function logout(){
  setWorking(true);
  try{await fetch("/api/account/logout",{method:"POST",credentials:"same-origin"});}
  finally{window.location.assign("/account");}
 }
 return <main className="hc-account-page">
  <Header/>
  <section className="hc-account-shell">
   <div className="hc-account-intro">
    <p className="hc-premium-kicker">{account.ownerPremium?"YOUR HEROCON / OWNER PREMIUM":"YOUR HEROCON / FREE ACCOUNT"}</p>
    <h1>Your account.<br/><em>Your cart.</em></h1>
    <p>{account.ownerPremium?<>Your account has <strong>complimentary Owner Premium</strong> access. No £9.99 monthly membership is required. Live product purchasing is paused during the HioBuy fulfilment migration.</>:<>Create an account to save products in your cart and explore original marketplace listings. <strong>Registration is free.</strong> Paid membership is optional while product ordering is being developed.</>}</p>
    <div className="hc-account-perks">
     <p><strong>01 / SIGN UP</strong> Create your free account.</p>
     <p><strong>02 / YOUR CART</strong> Keep your selected products together.</p>
     <p><strong>03 / MEMBERSHIP</strong> {account.ownerPremium?"Owner Premium included at £0/month. HioBuy testing is reserved for your account.":"Optional £9.99/month early access. Product orders are not yet available."}</p>
    </div>
    {pending&&<p className="hc-account-pending">Your selected product will be added after sign-in.</p>}
   </div>
   <div className="hc-account-card">
    {account.status==="authenticated"&&!next?<>
     <p className="hc-premium-kicker">ACCOUNT ACTIVE</p>
     <h2>Welcome back.</h2>
     <p>Signed in as <strong>{account.email}</strong>.</p>
     {account.ownerPremium&&<><p role="status" style={{background:"#ecf4e9",color:"#215b37",padding:14,borderRadius:12,fontWeight:800}}>Owner Premium active · Complimentary · No new subscription charge</p><Link href="/orders?test=1">Private test workspace <ArrowIcon direction="right"/></Link><Link href="/owner/hiobuy">HioBuy fulfilment setup <ArrowIcon direction="right"/></Link></>}
     <Link className="hc-account-primary-link" href="/cart">View your cart <ArrowIcon direction="right"/></Link><Link href="/orders">Orders <ArrowIcon direction="right"/></Link><Link href="/warehouse">Warehouse <ArrowIcon direction="right"/></Link><Link href="/parcels">Parcels <ArrowIcon direction="right"/></Link>
     <Link href="/membership/activate">Manage membership and billing <ArrowIcon direction="right"/></Link>
     <button type="button" onClick={logout} disabled={working} className="hc-account-secondary">Log out</button>
    </>:account.status==="unavailable"?<>
     <p className="hc-premium-kicker">ACCOUNT SETUP</p>
     <h2>Sign-in unavailable.</h2>
     <p>Please try again shortly or contact support.</p>
     <Link className="hc-account-primary-link" href="/search">Continue browsing <ArrowIcon direction="right"/></Link>
    </>:account.status==="authenticated"&&next?<>
     <h2>Opening your cart…</h2>
    </>:<>
     <div className="hc-account-tabs">
      <button type="button" className={mode==="signup"?"active":""} onClick={()=>{setMode("signup");setNotice("");}}>Create account</button>
      <button type="button" className={mode==="login"?"active":""} onClick={()=>{setMode("login");setNotice("");}}>Sign in</button>
     </div>
     <h2>{mode==="signup"?"Create your free account":mode==="login"?"Welcome back":"Reset your password"}</h2>
     <p>{mode==="signup"?"Your account is free.":mode==="login"?"Sign in to your personal cart.":"We'll send reset instructions if this email has an account."}</p>
     <form onSubmit={handleSubmit}>
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/></label>
      {mode!=="recover"&&<label>Password<input type="password" required minLength={12} maxLength={128} autoComplete={mode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/><small>At least 12 characters</small></label>}
      <button type="submit" disabled={working||account.status==="checking"} style={buttonStyle}>
       {working?"Please wait…":mode==="signup"?"Create free account":mode==="login"?"Sign in":"Send password-reset email"}
      </button>
     </form>
     {mode==="login"?<button type="button" className="hc-account-text-button" onClick={()=>{setMode("recover");setNotice("");}}>Forgot your password?</button>:mode==="recover"?<button type="button" className="hc-account-text-button" onClick={()=>setMode("login")}>Back to sign in</button>:null}
     {notice&&<p role="status" className="hc-account-notice">{notice}</p>}
     {readyToConfirm&&<p className="hc-account-notice">Use the email link in this browser to restore the pending product, even if it opens a new tab. If you verify on another device, return to this one and sign in.</p>}
     <p className="hc-account-fine">By creating an account you agree to our <Link href="/terms-and-conditions">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</p>
    </>}
   </div>
  </section>
 </main>;
}
export default function AccountPage(){
 return <Suspense fallback={<main className="hc-account-page"><Header/><section className="hc-account-shell"><p>Loading account…</p></section></main>}><AccountContent/></Suspense>;
}
