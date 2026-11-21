"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useState} from "react";
import {agents} from "@/lib/agents";
export default function AgentModal({open,onClose,productId,variantId,selection,marketplaceUrl,agentLinks}:{open:boolean;onClose:()=>void;productId:string;variantId?:string;selection:string;marketplaceUrl?:string;agentLinks?:Record<string,string>}){
 const [copied,setCopied]=useState(false);
 if(!open)return null;
 const copy=async()=>{if(!marketplaceUrl)return;try{await navigator.clipboard.writeText(marketplaceUrl);setCopied(true)}catch{window.prompt("Copy original marketplace URL:",marketplaceUrl)}};
 return <div className="hc-agent-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
 <section className="hc-agent-dialog" role="dialog" aria-modal="true" aria-labelledby="agent-title">
 <header className="hc-agent-dialog-head"><h2 id="agent-title">Select a purchasing partner</h2><button onClick={onClose} aria-label="Close agent selection"><ArrowIcon direction="close"/></button></header>
 <div className="hc-agent-list">
 {agents.map((a,i)=>{const configured=Boolean(agentLinks?.[a.id]);return <article key={a.id} className="hc-agent-option"><div className="hc-agent-option-top"><span className={`hc-agent-logo hc-agent-logo-${i%6}`} aria-hidden="true">{String(i+1).padStart(2,"0")}</span><div><strong>{a.name}</strong><small>{a.description}</small></div></div><div className="hc-agent-option-actions">{configured?<a href={`/go/${a.id}/${encodeURIComponent(productId)}${variantId?`?variant=${encodeURIComponent(variantId)}`:""}`} target="_blank" rel="noopener noreferrer">Use {a.name} <ArrowIcon/></a>:<button onClick={copy} disabled={!marketplaceUrl}>{copied?"Link copied":`Copy link for ${a.name}`}</button>}</div></article>})}
 </div>
 <div className="hc-agent-direct"><div className="hc-agent-option-top"><span className="hc-agent-logo hc-agent-logo-direct" aria-hidden="true"><ArrowIcon/></span><div><strong>Direct Link</strong><small>Original 1688, Taobao or Weidian listing</small></div></div><div className="hc-agent-direct-actions">{marketplaceUrl&&<a href={marketplaceUrl} target="_blank" rel="noopener noreferrer">Open <ArrowIcon/></a>}<button onClick={copy} disabled={!marketplaceUrl} aria-label="Copy direct marketplace link">{copied?"Copied":"Copy link"}</button></div></div>
 <p className="hc-agent-note">Selected Herocon option: <strong>{selection}</strong>. Partner services are operated independently of Herocon. You may need to choose your size or colour again on the partner website. If a direct redirect is unavailable, copy the original product link instead. Prices, stock and terms must be reconfirmed with the partner.</p>
 </section></div>
}