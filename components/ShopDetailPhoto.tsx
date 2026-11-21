"use client";
import {useState} from "react";
export default function ShopDetailPhoto({src,alt}:{src:string;alt:string}){
 const [failed,setFailed]=useState(false);
 return <div className="hc-personal-detail-photo">
  {!failed?<img src={src} alt={alt} loading="eager" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:
   <div className="hc-personal-detail-photo-missing" role="status">This source photograph is no longer available. Please check the original listing for current images.</div>}
 </div>;
}
