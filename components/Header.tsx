"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {useCart} from "@/components/CartProvider";
function NavArrow(){return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>;}
export default function Header(){
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  // Keep the mobile navigation in sync with route and viewport changes.
  useEffect(()=>{setOpen(false);},[pathname]);
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    const onResize=()=>{if(window.innerWidth>1120)setOpen(false);};
    window.addEventListener("keydown",onKeyDown);
    window.addEventListener("resize",onResize);
    return ()=>{window.removeEventListener("keydown",onKeyDown);window.removeEventListener("resize",onResize);};
  },[]);

  const {count,account}=useCart();
  const links=[["Shop for yourself","/shop-for-yourself"],["Start a business","/start-a-business"],["How sourcing works","/how-it-works"],["Membership","/membership"]];
  return <>
    <div className="sc-announcement">SOURCE FROM 1688, TAOBAO, WEIDIAN &amp; MORE</div>
    <header className="sc-header">
      <div className="sc-nav-inner">
        <Link href="/" className="sc-wordmark" aria-label="Herocon homepage">hero<span>con.</span></Link>
        <nav className="sc-desktop-links" aria-label="Main navigation">
          {links.map(([label,url])=><Link key={url} href={url} aria-current={pathname===url?"page":undefined}>{label}</Link>)}
        </nav>
        <div className="sc-nav-actions">
          <Link className="hc-cart-nav-link hc-mobile-account-link" href="/account" aria-label={account.status==="authenticated"?"My account":"Sign in or create an account"}>
            <svg className="hc-mobile-nav-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M5.3 20c.3-4 2.7-6.1 6.7-6.1s6.4 2.1 6.7 6.1"/></svg>
            <span className="hc-nav-account-label">{account.status==="authenticated"?"My account":"Sign in / Join free"}</span>
          </Link>
          <Link className="hc-cart-nav-link hc-mobile-cart-link" href="/cart" aria-label={"Cart with "+count+" items"}>
            <svg className="hc-mobile-nav-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 5.5h2l2 10.5h11.4l2-8H6.2"/><circle cx="9" cy="19.5" r="1"/><circle cx="18" cy="19.5" r="1"/></svg>
            <span className="hc-nav-cart-label">Cart</span><span className="hc-nav-cart-count">{count}</span>
          </Link>
          <Link className="sc-nav-cta" href="/find-product">Paste a product link <NavArrow/></Link>
          <button type="button" className="sc-mobile-toggle" aria-label={open?"Close menu":"Open menu"} aria-expanded={open} aria-controls="sc-mobile-menu" onClick={()=>setOpen(!open)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      {open&&<nav id="sc-mobile-menu" className="sc-mobile-menu" aria-label="Mobile navigation">{links.map(([label,url])=><Link key={url} href={url} aria-current={pathname===url?"page":undefined} onClick={()=>setOpen(false)}>{label}<NavArrow/></Link>)}<Link href="/find-product" onClick={()=>setOpen(false)}>Paste a product link <NavArrow/></Link><Link href="/cart" onClick={()=>setOpen(false)}>Cart ({count}) <NavArrow/></Link><Link href="/account" onClick={()=>setOpen(false)}>{account.status==="authenticated"?"My account":"Sign in / Join free"} <NavArrow/></Link></nav>}
    </header>
  </>;
}