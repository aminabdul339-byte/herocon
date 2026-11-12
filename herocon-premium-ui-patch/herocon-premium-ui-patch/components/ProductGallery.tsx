"use client";
import {useMemo,useState} from "react";
export default function ProductGallery({title,imageUrl,images=[]}:{title:string;imageUrl?:string;images?:string[]}){
 const clean=useMemo(()=>[...new Set([imageUrl,...images].filter((x):x is string=>Boolean(x)))],[imageUrl,images]);const[active,setActive]=useState(clean[0]);
 if(!active)return <div className="gallery-main no-image">No image available</div>;
 return <div className="gallery"><div className="gallery-main"><img src={active} alt={title}/></div>{clean.length>1&&<div className="gallery-thumbs" aria-label="Product images">{clean.slice(0,10).map((src,i)=><button key={src} className={src===active?"selected":""} onClick={()=>setActive(src)} aria-label={`View image ${i+1}`}><img src={src} alt=""/></button>)}</div>}</div>
}
