"use client";
import Link from "next/link";
import {useState} from "react";
import {useCart} from "@/components/CartProvider";
export default function Header(){
  const [open,setOpen]=useState(false);
  const {count,account}=useCart();
  const links=[["Explore products","/search"],["Start a business","/start-a-business"],["How sourcing works","/how-it-works"],["Membership","/membership"]];
  return <>
    <div className="sc-announcement">SOURCE FROM 1688, TAOBAO, WEIDIAN &amp; MORE</div>
    <header className="sc-header">
      <div className="sc-nav-inner">
        <Link href="/" className="sc-wordmark" aria-label="Herocon homepage">hero<span>con.</span></Link>
        <nav className="sc-desktop-links" aria-label="Main navigation">
          {links.map(([label,url])=><Link key={url} href={url}>{label}</Link>)}
        </nav>
        <div className="sc-nav-actions">
          <Link className="hc-cart-nav-link" href="/account">{account.status==="authenticated"?"My account":"Sign in / Join free"}</Link>
          <Link className="hc-cart-nav-link" href="/cart" aria-label={"Cart with "+count+" items"}>Cart <span>{count}</span></Link>
          <Link className="sc-nav-cta" href="/find-product">Paste a product link <span aria-hidden="true">↗</span></Link>
          <button type="button" className="sc-mobile-toggle" aria-label={open?"Close menu":"Open menu"} aria-expanded={open} aria-controls="sc-mobile-menu" onClick={()=>setOpen(!open)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      {open&&<nav id="sc-mobile-menu" className="sc-mobile-menu" aria-label="Mobile navigation">{links.map(([label,url])=><Link key={url} href={url} onClick={()=>setOpen(false)}>{label}<span aria-hidden="true">↗</span></Link>)}<Link href="/find-product" onClick={()=>setOpen(false)}>Paste a product link <span>↗</span></Link><Link href="/cart" onClick={()=>setOpen(false)}>Cart <span>{count}</span></Link><Link href="/account" onClick={()=>setOpen(false)}>{account.status==="authenticated"?"My account":"Sign in / Join free"} <span>↗</span></Link></nav>}
    </header>
  </>;
}