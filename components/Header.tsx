"use client";
import Link from "next/link";
import {useState} from "react";
export default function Header(){
  const [open,setOpen]=useState(false);
  const links=[["Explore products","/search"],["Start a business","/start-a-business"],["How sourcing works","/how-it-works"]];
  return <>
    <div className="sc-announcement">YOUR GATEWAY TO SMARTER PRODUCT SOURCING FROM CHINA <span aria-hidden="true">✦</span> BUILT FOR INDEPENDENT BUSINESSES</div>
    <header className="sc-header">
      <div className="sc-nav-inner">
        <Link href="/" className="sc-wordmark" aria-label="Herocon homepage">hero<span>con.</span></Link>
        <nav className="sc-desktop-links" aria-label="Main navigation">
          {links.map(([label,url])=><Link key={url} href={url}>{label}</Link>)}
        </nav>
        <div className="sc-nav-actions">
          <Link className="sc-saved" href="/saved" aria-label="Saved products"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M20.8 4.6a5.6 5.6 0 0 0-7.9 0L12 5.5l-.9-.9a5.6 5.6 0 1 0-7.9 7.9L12 21l8.8-8.5a5.6 5.6 0 0 0 0-7.9z"/></svg><span>Saved</span></Link>
          <Link className="sc-nav-cta" href="/sourcing">Get sourcing help <span aria-hidden="true">↗</span></Link>
          <button type="button" className="sc-mobile-toggle" aria-label={open?"Close menu":"Open menu"} aria-expanded={open} aria-controls="sc-mobile-menu" onClick={()=>setOpen(!open)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      {open&&<nav id="sc-mobile-menu" className="sc-mobile-menu" aria-label="Mobile navigation">{links.map(([label,url])=><Link key={url} href={url} onClick={()=>setOpen(false)}>{label}<span aria-hidden="true">↗</span></Link>)}<Link href="/sourcing" onClick={()=>setOpen(false)}>Get sourcing help <span>↗</span></Link><Link href="/saved" onClick={()=>setOpen(false)}>Saved products <span>♡</span></Link></nav>}
    </header>
  </>;
}