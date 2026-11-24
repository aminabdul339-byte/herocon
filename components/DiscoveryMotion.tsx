"use client";
import Link from "next/link";
import {useState} from "react";
type Card={id:string;title:string;marketplace:string;image:string;price:string;position:number};
export default function DiscoveryMotion({cards}:{cards:Card[]}){
 const [paused,setPaused]=useState(false);
 return <div className="hd-scene" data-paused={paused}>
  <div className="hd-orbit" aria-hidden="true"/>
  {cards.map(card=><Link key={card.id} prefetch={false} href={"/product/"+encodeURIComponent(card.id)} className={"hd-float hd-float-"+card.position} aria-label={"Explore "+card.title+" on Herocon"}>
    <div className="hd-card-photo"><img src={card.image} alt={card.title} width={360} height={280} loading={card.position<3?"eager":"lazy"} decoding="async" referrerPolicy="no-referrer"/></div>
    <div className="hd-card-meta"><span>{card.title}</span><div className="hd-card-price"><b>{card.price}</b><small>{card.marketplace} · reference price</small></div></div>
  </Link>)}
  <Link href="/search" className="hd-source-pill"><i aria-hidden="true"/>Discover the original source</Link>
  <button type="button" className="hd-motion-toggle" aria-label={paused?"Resume card animation":"Pause card animation"} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>
   <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paused?<path d="m8 5 11 7-11 7z"/>:<><path d="M9 5v14"/><path d="M15 5v14"/></>}</svg>
  </button>
 </div>;
}
