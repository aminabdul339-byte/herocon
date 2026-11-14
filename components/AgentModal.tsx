"use client";
import {useState} from "react";
import {agents} from "@/lib/agents";
export default function AgentModal({open,onClose,productId,variantId,selection,marketplaceUrl,agentLinks}:{open:boolean;onClose:()=>void;productId:string;variantId?:string;selection:string;marketplaceUrl?:string;agentLinks?:Record<string,string>}){
 const [copied,setCopied]=useState(false);
 if(!open)return null;
 const copy=async()=>{if(!marketplaceUrl)return;try{await navigator.clipboard.writeText(marketplaceUrl);setCopied(true)}catch{window.prompt("Copy original marketplace URL:",marketplaceUrl)}};
 return <div className="hc-agent-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
 <section className="hc-agent-dialog" role="dialog" aria-modal="true" aria-labelledby="agent-title">
 <header className="hc-agent-dialog-head"><h2 id="agent-title">Select default Agent</h2><button onClick={onClose} aria-label="Close agent selection">×</button></header>
 <div className="hc-agent-list">
 {agents.map((a,i)=>{const configured=Boolean(agentLinks?.[a.id]);return <article key={a.id} className="hc-agent-option"><div className="hc-agent-option-top"><span className={`hc-agent-logo hc-agent-logo-${i%6}`} aria-hidden="true">{a.name.slice(0,2).toUpperCase()}</span><div><strong>{a.name}</strong><small>{a.description}</small></div></div><div className="hc-agent-option-actions">{configured?<a href={`/go/${a.id}/${encodeURIComponent(productId)}${variantId?`?variant=${encodeURIComponent(variantId)}`:""}`} target="_blank" rel="noopener noreferrer">Use {a.name} ↗</a>:<button onClick={copy} disabled={!marketplaceUrl}>{copied?"Link copied ✓":`Copy link for ${a.name}`}</button>}</div></article>})}
 </div>
 <div className="hc-agent-direct"><div className="hc-agent-option-top"><span className="hc-agent-logo hc-agent-logo-direct" aria-hidden="true">↗</span><div><strong>Direct Link</strong><small>Original 1688, Taobao or Weidian listing</small></div></div><div className="hc-agent-direct-actions">{marketplaceUrl&&<a href={marketplaceUrl} target="_blank" rel="noopener noreferrer">Open ↗</a>}<button onClick={copy} disabled={!marketplaceUrl} aria-label="Copy direct marketplace link">{copied?"Copied ✓":"Copy link"}</button></div></div>
 <p className="hc-agent-note">For agents without a configured product redirect, copy the original link and paste it into the agent’s website. Promotions and discounts are not verified.</p>
 </section></div>
}