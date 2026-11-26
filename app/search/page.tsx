import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import {Suspense} from "react";
import {CatalogueGridSkeleton} from "@/components/CatalogueLoading";
import type {Product} from "@/lib/types";
import {productSearchScore} from "@/lib/product-search";
import {PRIMARY_CATEGORIES,resolveCategory} from "@/lib/product-taxonomy";
import {getBrowseProducts as getProducts} from "@/lib/catalogue-server";
import {enrichVisibleProductCards} from "@/lib/marketplace-source-enrichment";
import {prioritizeSavedPartnerProducts,attachSavedPartnerImages} from "@/lib/catalogue-priority";
import {prioritizeJewelleryDiscovery} from "@/lib/jewellery-discovery-order";
import {prioritizeHairDiscovery} from "@/lib/hair-discovery-order";
import {preserveBusinessOrder,restoreBusinessEditThumbnails} from "@/lib/business-catalogue-edit";
export const dynamic="force-dynamic";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import SourcingHub from "@/components/SourcingHub";
import CatalogueSort from "@/components/CatalogueSort";
import {CatalogueCategoryLink,CatalogueCategoryScroll,CatalogueMobileCategory} from "@/components/CatalogueCategoryNavigation";
import type {Metadata} from "next";
import "./catalogue-intro.css";
export const metadata:Metadata={title:"Explore wholesale products",description:"Explore products with recorded original marketplace links. Search by category or keyword."};
const PAGE_SIZE=24;
export default async function SearchPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const [s,all]=await Promise.all([searchParams,getProducts()]);
 const query=typeof s.q==="string"?s.q.trim().slice(0,160):"",requestedCategory=(s.category||"").trim(),cat=/^(?:sets?\s*&\s*co-ords|co-ords|sets?)$/i.test(requestedCategory)?"":resolveCategory(requestedCategory)||requestedCategory,sort=["newest","price-asc","price-desc"].includes(s.sort||"")?s.sort!:"recommended";
 const collection=s.collection==="clothing"?"clothing":"";

 const clothingCategories=new Set(["Tops","Bottoms","Dresses","Modest Fashion","Outerwear","Underwear & Lingerie","Sleepwear & Loungewear"]);
 const clothingCount=all.filter(p=>clothingCategories.has(p.category||"")).length;
 const preview=all;
 const scored=preview.map(p=>({product:p,score:productSearchScore(p,query)})).filter(x=>x.score>0&&(!cat||x.product.category===cat)&&(!collection||clothingCategories.has(x.product.category||"")));
 if(query)scored.sort((a,b)=>b.score-a.score);
 let products=scored.map(x=>x.product);
 // Mark saved supplier details first; explicit sorting must then apply
 // across the entire catalogue rather than separately within saved groups.
 if((query||cat||collection||sort!=="recommended"))products=await prioritizeSavedPartnerProducts(products);
 if(cat==="Wigs & Hair Extensions"&&!query&&sort==="recommended")products=prioritizeHairDiscovery(products);
 if(cat==="Jewellery"&&!query&&sort==="recommended")products=prioritizeJewelleryDiscovery(products);
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
 // Only the unfiltered Relevant view receives the curated, mixed pagination.
 // Search terms, category browsing, newest and price ordering stay unchanged.
 const isDefaultEdit=!query&&!cat&&!collection&&sort==="recommended";
 if(isDefaultEdit)products=preserveBusinessOrder(products);
 const categoryCounts=new Map<string,number>();for(const p of all){if(p.category)categoryCounts.set(p.category,(categoryCounts.get(p.category)||0)+1)}
 const categories=PRIMARY_CATEGORIES.filter(c=>(categoryCounts.has(c)||c==="Modest Fashion")&&(!collection||clothingCategories.has(c)));
 const requestedPage=Math.max(1,Number.parseInt(s.page||"1")||1),pages=Math.max(1,Math.ceil(products.length/PAGE_SIZE)),page=Math.min(requestedPage,pages);
 const visible=products.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);


 const link=(change:Record<string,string|null>)=>{const params=new URLSearchParams();if(query)params.set("q",query);if(cat)params.set("category",cat);if(collection)params.set("collection",collection);if(sort!=="recommended")params.set("sort",sort);for(const[k,v]of Object.entries(change)){if(v)params.set(k,v);else params.delete(k)}const qs=params.toString();return "/search"+(qs?"?"+qs:"");};
 const edits=[["Flowers & Gifts","Flowers & Gifts","Thoughtful bouquets and gifts","link-0079b4276e61ff3cba8d7e33b475"],["Jewellery","Jewellery","Pieces to build a brand around","qLiCZEEhOnut6fHdkH-Bow"],["Lighting","Home & Lighting","Lighting with character","YZ83IwkNXmZvD7Vni39yAA"],["Wigs & Hair Extensions","Wigs & Hair Extensions","Discover hair for your brand","HEWCWVJ5M7RL3Y-J_uV0bg"]].flatMap(([category,title,subtitle,id])=>{const item=preview.find(p=>p.doppelProductId===id&&p.category===category&&p.imageUrl)||preview.find(p=>p.category===category&&p.imageUrl);return item?.imageUrl?[{category,title,subtitle,image:category==="Wigs & Hair Extensions"?"/editorial-wigs-hair.webp":item.imageUrl}]:[];});
 return <main className="sc-catalogue-page"><Header/><section className={"sc-page-hero sc-catalogue-intro sc-container"+(isDefaultEdit&&page===1?" hc-sourcing-intro-expanded":"")} aria-labelledby="sc-catalogue-title"><p className="sc-kicker">THE SOURCING CATALOGUE</p><h1 id="sc-catalogue-title">Discover your next <em>opportunity.</em></h1><p>Find products worth building a business around. Reference prices exclude delivery and other sourcing costs.</p><SourcingHub expanded={isDefaultEdit&&page===1}>{<form className="sc-searchbar sc-searchbar-page" action="/search" role="search"><span className="sc-search-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></span><input name="q" defaultValue={query} placeholder="Search all products…" aria-label="Search all products"/>{cat&&<input type="hidden" name="category" value={cat}/>} {collection&&<input type="hidden" name="collection" value={collection}/>} {sort!=="recommended"&&<input type="hidden" name="sort" value={sort}/>}<button type="submit">Search</button></form>}</SourcingHub>{isDefaultEdit&&page===1&&<div className="hc-discovery-edits" aria-label="Featured collections">{edits.map(e=><Link key={e.category} href={"/search?category="+encodeURIComponent(e.category)} prefetch={false} scroll={false} className="hc-discovery-edit"><div className="hc-discovery-edit-photo"><img src={e.image} alt="" loading="lazy" referrerPolicy="no-referrer"/></div><div><strong>{e.title}</strong><small>{e.subtitle}</small></div></Link>)}</div>}</section>
 <section className="sc-container sc-catalogue-layout"><aside className="sc-catalogue-sidebar"><h2>{collection?"Clothing categories":"Product categories"}</h2>{collection&&<Link href="/search"><ArrowIcon direction="left"/> Full catalogue</Link>}<CatalogueMobileCategory key={cat} category={cat} collection={collection} query={query} sort={sort} categories={categories.map(c=>({name:c,count:categoryCounts.get(c)||0}))}/><CatalogueCategoryLink active={!cat} href={link({category:null,page:null})}>{collection?"All clothing":"All categories"} <span>{(collection?clothingCount:all.length).toLocaleString()}</span></CatalogueCategoryLink>{categories.map(c=><CatalogueCategoryLink active={cat===c} key={c} href={link({category:c,page:null})}>{c} <span>{(categoryCounts.get(c)||0).toLocaleString()}</span></CatalogueCategoryLink>)}<div className="sc-sidebar-note"><strong>First time sourcing?</strong><p>Learn how to check a supplier and calculate your real costs.</p><Link href="/how-it-works">Read the guide</Link></div></aside>
 <div className="sc-results" id="catalogue-results"><CatalogueCategoryScroll category={cat}/><div className="sc-results-heading"><div><strong>{products.length.toLocaleString()} products</strong><span>{cat?" in "+cat:collection?" in Clothing":""}{query?' matching "'+query+'"':""}</span></div>{<CatalogueSort key={JSON.stringify([sort,query,cat,collection])} sort={sort} query={query} category={cat} collection={collection}/>}</div>
 {(cat||collection)&&<div className="sc-active-filters">{collection&&<><span>Clothing</span><Link href={link({collection:null,category:null,page:null})}>Clear clothing collection <ArrowIcon direction="close"/></Link></>}{cat&&<><span>{cat}</span><Link href={link({category:null,page:null})}>Clear category <ArrowIcon direction="close"/></Link></>}</div>}
 {visible.length?<><Suspense key={JSON.stringify([query,cat,collection,sort,page])} fallback={<CatalogueGridSkeleton/>}><BusinessGrid visible={visible} isDefaultEdit={isDefaultEdit}/></Suspense><nav className="sc-pagination" aria-label="Catalogue pages">{page>1&&<Link href={link({page:String(page-1)})}><ArrowIcon direction="left"/> Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link href={link({page:String(page+1)})}>Next <ArrowIcon direction="right"/></Link>}</nav></>:<div className="sc-empty-state"><h2>No matching products yet.</h2><p>Try another keyword or browse the catalogue.</p><Link href="/search" className="sc-button sc-button-dark">Browse available products <ArrowIcon/></Link></div>}
 </div></section></main>;
}

async function BusinessGrid({visible,isDefaultEdit}:{visible:Product[];isDefaultEdit:boolean}){
 const [partnerCards,sourceCards]=await Promise.all([attachSavedPartnerImages(visible),enrichVisibleProductCards(visible)]);
 const enriched=partnerCards.map((p,i)=>{const other=sourceCards[i];return other.hasPartnerDetails?{...p,...other,supplierTitle:other.supplierTitle||p.supplierTitle,images:[...new Set([p.imageUrl,...(other.images||[]),...(p.images||[])].filter((url):url is string=>!!url))].slice(0,12),imageUrl:p.imageUrl||other.imageUrl,sellerName:other.sellerName||p.sellerName,variantCount:other.variantCount??p.variantCount}:p;});
 const shown=isDefaultEdit?restoreBusinessEditThumbnails(enriched,visible):enriched;
 return <div className="sc-results-grid">{shown.map((p,i)=><ProductCard key={p.doppelProductId} product={{canonicalId:p.canonicalId,doppelProductId:p.doppelProductId,title:p.title,displayTitle:p.displayTitle,supplierTitle:p.supplierTitle,originalTitle:p.originalTitle,category:p.category,imageUrl:p.imageUrl,images:p.images,price:p.price,priceGBP:p.priceGBP,hasPartnerDetails:p.hasPartnerDetails,variantCount:p.variantCount}} eager={i<2}/>)}</div>;
}
