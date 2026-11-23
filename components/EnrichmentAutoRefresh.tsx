"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

/** Refreshes the owner-only dashboard view, never calls either paid supplier API. */
export default function EnrichmentAutoRefresh(){
 const router=useRouter();
 useEffect(()=>{
  const refresh=()=>{
   if(document.visibilityState==="visible")router.refresh();
  };
  const id=window.setInterval(refresh,60_000);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{
   window.clearInterval(id);
   document.removeEventListener("visibilitychange",refresh);
  };
 },[router]);
 return <p style={{fontSize:12,color:"#64746a",margin:"8px 0 0"}}>
  This dashboard refreshes every minute while open. Refreshing it does not make a paid supplier request.
 </p>;
}
