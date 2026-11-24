import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import {productSearchScore} from "@/lib/product-search";
import {PRIMARY_CATEGORIES,resolveCategory} from "@/lib/product-taxonomy";
import {getProducts} from "@/lib/catalogue-server";
import {enrichVisibleProductCards} from "@/lib/marketplace-source-enrichment";
import {prioritizeSavedPartnerProducts,attachSavedPartnerImages} from "@/lib/catalogue-priority";
import {leadWithBusinessEdit,restoreBusinessEditThumbnails} from "@/lib/business-catalogue-edit";
export const dynamic="force-dynamic";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import CatalogueSort from "@/components/CatalogueSort";
import type {Metadata} from "next";
import "./catalogue-intro.css";
export const metadata:Metadata={title:"Explore wholesale products",description:"Explore products with recorded original marketplace links. Search by category or keyword."};
const PAGE_SIZE=24;
export default async function SearchPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const s=await searchParams,all=await getProducts();
 const query=(s.q||"").trim(),requestedCategory=(s.category||"").trim(),cat=resolveCategory(requestedCategory)||requestedCategory,sort=s.sort||"recommended";
 const collection=s.collection==="clothing"?"clothing":"";
 const clothingCategories=new Set(["Tops","Bottoms","Dresses","Outerwear","Sets & Co-ords","Underwear & Lingerie","Sleepwear & Loungewear"]);
 const clothingCount=all.filter(p=>clothingCategories.has(p.category||"")).length;
 const scored=all.map(p=>({product:p,score:productSearchScore(p,query)})).filter(x=>x.score>0&&(!cat||x.product.category===cat)&&(!collection||clothingCategories.has(x.product.category||"")));
 scored.sort((a,b)=>b.score-a.score);
 let products=scored.map(x=>x.product);
 // Mark saved supplier details first; explicit sorting must then apply
 // across the entire catalogue rather than separately within saved groups.
 products=await prioritizeSavedPartnerProducts(products);
 const price=(p:typeof products[number])=>{
  if(typeof p.priceGBP==="number"&&Number.isFinite(p.priceGBP))return p.priceGBP;
  const match=(p.price||"").trim().match(/^£\s*([\d,]+(?:\.\d+)?)$/);
  return match?Number(match[1].replace(/,/g,"")):null;
 };
 if(sort==="price-asc"||sort==="price-desc")products=[...products].sort((a,b)=>{
  const left=price(a),right=price(b);
  if(left===null)return right===null?0:1;
  if(right===null)return -1;
  return sort==="price-asc"?left-right:right-left;
 });
 if(sort==="newest")products=[...products].sort((a,b)=>(b.collectedAt||"").localeCompare(a.collectedAt||""));
 // Only the unfiltered Relevant view receives a mixed editorial lead.
 // Search terms, category browsing, newest and price ordering stay unchanged.
 const isDefaultEdit=!query&&!cat&&!collection&&sort==="recommended";
 if(isDefaultEdit)products=leadWithBusinessEdit(products);
 const categoryCounts=new Map<string,number>();for(const p of all){if(p.category)categoryCounts.set(p.category,(categoryCounts.get(p.category)||0)+1)}
 const categories=PRIMARY_CATEGORIES.filter(c=>categoryCounts.has(c)&&(!collection||clothingCategories.has(c)));
 const requestedPage=Math.max(1,Number.parseInt(s.page||"1")||1),pages=Math.max(1,Math.ceil(products.length/PAGE_SIZE)),page=Math.min(requestedPage,pages);
 const visible=products.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 const enriched=await enrichVisibleProductCards(await attachSavedPartnerImages(visible));
 const shown=isDefaultEdit?restoreBusinessEditThumbnails(enriched,visible):enriched;
 const categoryHref=(category:string)=>"/category/"+encodeURIComponent(category);
 const link=(change:Record<string,string|null>)=>{const params=new URLSearchParams();if(query)params.set("q",query);if(cat)params.set("category",cat);if(collection)params.set("collection",collection);if(sort!=="recommended")params.set("sort",sort);for(const[k,v]of Object.entries(change)){if(v)params.set(k,v);else params.delete(k)}const qs=params.toString();return "/search"+(qs?"?"+qs:"");};
 return <main className="sc-catalogue-page"><Header/><section className="sc-page-hero sc-catalogue-intro sc-container" aria-labelledby="sc-catalogue-title"><p className="sc-kicker">THE SOURCING CATALOGUE</p><h1 id="sc-catalogue-title">Find your next <em>product.</em></h1><p>Explore products with recorded links to original Chinese marketplaces. Listed prices are starting references, not delivered costs.</p><form className="sc-searchbar sc-searchbar-page" action="/search" role="search"><span className="sc-search-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></span><input name="q" defaultValue={query} placeholder="Search all products, suppliers or categories…" aria-label="Search all products"/><button type="submit">Search</button></form></section>
 <section className="sc-container sc-catalogue-layout"><aside className="sc-catalogue-sidebar"><h2>{collection?"Clothing categories":"Product categories"}</h2>{collection&&<Link href="/search"><ArrowIcon direction="left"/> Full catalogue</Link>}<form className="sc-category-mobile" action="/search" method="get"><label htmlFor="mobile-category-select">Browse a category</label><select id="mobile-category-select" name="category" defaultValue={cat}><option value="">All categories</option>{categories.map(c=><option value={c} key={c}>{c} ({categoryCounts.get(c)})</option>)}</select><button type="submit">Show products</button></form><Link className={!cat?"sc-filter-active":""} href={collection?"/search?collection=clothing":"/search"}>{collection?"All clothing":"All categories"} <span>{(collection?clothingCount:all.length).toLocaleString()}</span></Link>{categories.map(c=><Link className={cat===c?"sc-filter-active":""} key={c} href={categoryHref(c)}>{c} <span>{(categoryCounts.get(c)||0).toLocaleString()}</span></Link>)}<div className="sc-sidebar-note"><strong>First time sourcing?</strong><p>Learn how to check a supplier and calculate your real costs.</p><Link href="/how-it-works">Read the guide</Link></div></aside>
 <div className="sc-results"><div className="sc-results-heading"><div><strong>{products.length.toLocaleString()} products</strong><span>{cat?" in "+cat:collection?" in Clothing":""}{query?' matching "'+query+'"':""}</span></div><CatalogueSort key={JSON.stringify([sort,query,cat,collection])} sort={sort} query={query} category={cat} collection={collection}/></div>
 {(cat||collection)&&<div className="sc-active-filters">{collection&&<><span>Clothing</span><Link href={link({collection:null,category:null,page:null})}>Clear clothing collection <ArrowIcon direction="close"/></Link></>}{cat&&<><span>{cat}</span><Link href={link({category:null,page:null})}>Clear category <ArrowIcon direction="close"/></Link></>}</div>}
 {shown.length?<><div className="sc-results-grid">{shown.map((p,i)=><ProductCard key={p.doppelProductId} product={p} eager={i<6}/>)}</div><nav className="sc-pagination" aria-label="Catalogue pages">{page>1&&<Link href={link({page:String(page-1)})}><ArrowIcon direction="left"/> Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link href={link({page:String(page+1)})}>Next <ArrowIcon direction="right"/></Link>}</nav></>:<div className="sc-empty-state"><h2>No matching products yet.</h2><p>Try a broader keyword or browse all the products available in the catalogue.</p><Link href="/search" className="sc-button sc-button-dark">Explore all products <ArrowIcon/></Link></div>}
 </div></section></main>;
}