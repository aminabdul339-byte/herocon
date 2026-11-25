"use client";
import {useEffect,useState} from "react";
import {trialCountdown} from "@/lib/premium-trial-model";
export default function AccountTrialCountdown({endsAt,clockOffsetMs}:{endsAt:string;clockOffsetMs:number}){
 const [now,setNow]=useState(()=>Date.now()+clockOffsetMs);
 useEffect(()=>{const tick=()=>setNow(Date.now()+clockOffsetMs);tick();const timer=window.setInterval(tick,1000);window.addEventListener("focus",tick);document.addEventListener("visibilitychange",tick);return()=>{window.clearInterval(timer);window.removeEventListener("focus",tick);document.removeEventListener("visibilitychange",tick);};},[clockOffsetMs]);
 const left=trialCountdown(endsAt,now);
 const units=[["Days",left.days],["Hours",left.hours],["Minutes",left.minutes]] as const;
 return <section className="hc-account-trial-countdown" aria-label="Premium trial time remaining">
  <div className="hc-account-trial-top"><strong>{left.expired?"Trial ended":"Premium trial"}</strong><span>{left.expired?"Expired":"Active"}</span></div>
  <div className="hc-account-trial-time" role="timer" aria-label={left.days+" days, "+left.hours+" hours, "+left.minutes+" minutes remaining"}>{units.map(([label,value])=><div key={label}><b>{String(value).padStart(2,"0")}</b><span>{label}</span></div>)}</div>
  <p>{left.expired?"Trial access has ended. Your account remains available.":"Time remaining. No automatic renewal."}</p>
 </section>;
}
