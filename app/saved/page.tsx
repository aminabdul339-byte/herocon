"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import {useSaved} from "@/components/SavedProvider";
import type {Product} from "@/lib/types";
export default function SavedPage(){
 const {saved}=useSaved();
 const [products,setProducts]=useState<Product[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const ids=[...saved].sort().join(",");
 useEffect(()=>{
  if(!ids){setProducts([]);return;}
  let aborted=false;setLoading(true);setError("");
  fetch("/api/saved?ids="+encodeURIComponent(ids),{cache:"no-store"})
   .then(r=>{if(!r.ok)throw Error("Could not load saved products");return r.json();})
   .then(data=>{if(!aborted)setProducts(Array.isArray(data.products)?data.products:[]);})
   .catch(e=>{if(!aborted)setError(e.message);})
   .finally(()=>{if(!aborted)setLoading(false);});
  return()=>{aborted=true};
 },[ids]);
 return <main className="sc-guide-page"><Header/><section className="sc-page-hero sc-container"><p className="sc-kicker">YOUR PRODUCT SHORTLIST</p><h1>Saved <em>products.</em></h1><p>Keep promising products in one place while you compare prices and plan your next sourcing request. Saved items are stored on this device.</p><Link className="sc-button sc-button-outline" href="/search">Browse the catalogue ↗</Link></section>
 <section className="sc-section sc-container">{loading?<p>Loading your saved products…</p>:error?<div className="sc-empty-state"><h2>Unable to load saved products.</h2><p>{error}</p></div>:products.length?<><p className="sc-kicker">{products.length} PRODUCTS SAVED</p><div className="sc-featured-grid sc-saved-grid" style={{marginTop:20}}>{products.map(p=><ProductCard key={p.doppelProductId} product={p}/>)}</div></>:<div className="sc-empty-state"><h2>Nothing saved yet.</h2><p>Save products using the heart on a product card, then return here to build your shortlist.</p><Link className="sc-button sc-button-dark" href="/search">Discover products ↗</Link></div>}</section></main>;
}