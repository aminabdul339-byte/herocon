"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {ExternalArrowIcon,ShopCategoryIcon} from "@/components/ShopIcons";
import {withoutEmoji} from "@/lib/emoji-free";

type AdditionalLink={label:string;url:string};
type ShopItem={
 id:string; name:string; category:string; priceGBP:number|null;
 shopUrl:string; originalUrl:string; additionalLinks:AdditionalLink[]; itemTip:string|null
};
const CATEGORY_INFO=[
 {value:"All",label:"All categories",number:"00"},
 {value:"Shoes",label:"Shoes",number:"01"},
 {value:"Tops",label:"Tops",number:"02"},
 {value:"Bottoms & shorts",label:"Bottoms & shorts",number:"03"},
 {value:"Jackets & coats",label:"Jackets & coats",number:"04"},
 {value:"Accessories",label:"Accessories",number:"05"}
] as const;
const PER_PAGE=36;

// A reproducible Fisher–Yates shuffle mixes the five categories in All categories.
// Keeping a fixed seed avoids cards changing position between pagination clicks.
function mixAllFinds(items:ShopItem[]):ShopItem[]{
 const mixed=[...items];
 let seed=0x627c3e21;
 for(let i=mixed.length-1;i>0;i--){
  seed^=seed<<13;
  seed^=seed>>>17;
  seed^=seed<<5;
  const j=(seed>>>0)%(i+1);
  [mixed[i],mixed[j]]=[mixed[j],mixed[i]];
 }
 return mixed;
}
const gbpFormat=(v:number)=>"£"+v.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
const thumbKind=(value:string)=>{
 if(value==="Shoes")return "shoes";
 if(value==="Tops")return "tops";
 if(value==="Bottoms & shorts")return "bottoms";
 if(value==="Jackets & coats")return "jackets";
 return "accessories";
};

export default function ShopForYourself({products:rawProducts}:{products:ShopItem[]}){
 const products=useMemo(()=>rawProducts.map(item=>({...item,name:withoutEmoji(item.name)})),[rawProducts]);
 const [category,setCategory]=useState("All");
 const [query,setQuery]=useState("");
 const [sort,setSort]=useState("original");
 const [page,setPage]=useState(1);
 const [failedPhotoIds,setFailedPhotoIds]=useState<Set<string>>(()=>new Set());
 const totals=useMemo(()=>{
  const counts:Record<string,number>={All:products.length};
  counts.All=0;
  for(const item of products){if(failedPhotoIds.has(item.id))continue;counts.All++;counts[item.category]=(counts[item.category]||0)+1;}
  return counts;
 },[products,failedPhotoIds]);
 const filtered=useMemo(()=>{
  const q=query.toLocaleLowerCase().trim();
  const items=products.filter(p=>!failedPhotoIds.has(p.id)&&(category==="All"||p.category===category)&&(!q||(p.name+" "+p.category).toLocaleLowerCase().includes(q)));
  if(sort==="price-low")items.sort((a,b)=>(a.priceGBP??Number.POSITIVE_INFINITY)-(b.priceGBP??Number.POSITIVE_INFINITY));
  if(sort==="price-high")items.sort((a,b)=>(b.priceGBP??Number.NEGATIVE_INFINITY)-(a.priceGBP??Number.NEGATIVE_INFINITY));
  if(sort==="name")items.sort((a,b)=>a.name.localeCompare(b.name));
  // Only the default All categories view is mixed; category order and explicit sorts stay unchanged.
  if(category==="All"&&sort==="original")return mixAllFinds(items);
  return items;
 },[products,category,query,sort,failedPhotoIds]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
 const currentPage=Math.min(page,totalPages);
 const visible=filtered.slice((currentPage-1)*PER_PAGE,currentPage*PER_PAGE);
 const resetPage=()=>setPage(1);
 return <section id="browse-finds" className="hc-self-listing hc-self-wrap" aria-labelledby="hc-self-listing-title">
  <div className="hc-self-section-head"><div><p className="hc-self-eyebrow">THE FULL EDIT / 05 COLLECTIONS</p><h2 id="hc-self-listing-title">Find your <em>favourite.</em></h2></div><p>Explore our selected finds with verified direct marketplace links. Product quality and supplier authenticity are not independently assessed.</p></div>
  <nav className="hc-self-categories" aria-label="Shop for Yourself categories">
   {CATEGORY_INFO.map(cat=><button key={cat.value} type="button" className={"hc-self-category"+(category===cat.value?" hc-self-category-active":"")} onClick={()=>{setCategory(cat.value);resetPage();}} aria-pressed={category===cat.value}>
     <span className="hc-self-category-icon" aria-hidden="true"><ShopCategoryIcon category={cat.value}/></span><span className="hc-self-category-title">{cat.label}<small>{(totals[cat.value]||0).toLocaleString("en-GB")} finds</small></span><span className="hc-self-category-number">{cat.number}</span>
    </button>)}
  </nav>
  <div className="hc-self-toolbar">
   <label className="hc-self-search"><svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" strokeWidth="1.7" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.6"/><path d="m15.5 15.5 5 5"/></svg><span className="hc-self-sr-only">Search products</span><input value={query} placeholder="Search by product name…" onChange={e=>{setQuery(e.target.value);resetPage();}}/></label>
   
   <label className="hc-self-sort">Sort <select value={sort} onChange={e=>{setSort(e.target.value);resetPage();}}><option value="original">{category==="All"?"Mixed finds":"Category order"}</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label>
  </div>
  <div className="hc-self-results-caption" aria-live="polite"><div><strong>{filtered.length.toLocaleString("en-GB")} results</strong><span>{category==="All"?"All categories":category}</span></div><span>Showing {filtered.length?(currentPage-1)*PER_PAGE+1:0}–{Math.min(currentPage*PER_PAGE,filtered.length)} of {filtered.length.toLocaleString("en-GB")}</span></div>
  {visible.length?<div className="hc-self-grid">
   {visible.map((p)=>{
    return <article className="hc-self-item" key={p.id}>
     <Link className={"hc-self-thumbnail hc-self-thumbnail-"+thumbKind(p.category)} href={"/shop-for-yourself/"+encodeURIComponent(p.id)} prefetch={false} aria-label={"View "+p.name}>
      <img className="hc-self-thumb-photo" src={"/shop-for-yourself-images/"+p.id+".webp"} alt={p.name} width={330} height={330} loading="lazy" decoding="async" onError={()=>setFailedPhotoIds(current=>{if(current.has(p.id))return current;const next=new Set(current);next.add(p.id);return next;})}/>
      <span className="hc-self-thumb-label">{p.category}</span>
     </Link>
     <div className="hc-self-item-body">
      <p className="hc-self-item-category">{p.category} <span>·</span> DIRECT MARKETPLACE LINK</p>
      <h3><Link href={"/shop-for-yourself/"+encodeURIComponent(p.id)} prefetch={false}>{p.name}</Link></h3>
      <div className="hc-self-item-price">{p.priceGBP!==null?<><strong>{gbpFormat(p.priceGBP)}</strong><span>reference price*</span></>:<span className="hc-self-price-missing">Price on request</span>}</div>
      <div className="hc-self-item-actions">
       <Link href={"/shop-for-yourself/"+encodeURIComponent(p.id)} prefetch={false} className="hc-self-link-primary">View product <span aria-hidden="true">→</span></Link>
       <a href={p.originalUrl} target="_blank" rel="noopener noreferrer nofollow" className="hc-self-link-secondary">Direct supplier listing <ExternalArrowIcon/></a>
      </div>
     </div>
    </article>;
   })}
  </div>:<div className="hc-self-empty"><strong>No matching finds.</strong><p>Try another search or clear the category and link filters.</p><button onClick={()=>{setQuery("");setCategory("All");resetPage();}}>Clear filters</button></div>}
  {totalPages>1&&<nav className="hc-self-pagination" aria-label="Product results pages"><button type="button" disabled={currentPage<=1} onClick={()=>{setPage(currentPage-1);document.getElementById("browse-finds")?.scrollIntoView({behavior:"smooth"});}}>← Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage>=totalPages} onClick={()=>{setPage(currentPage+1);document.getElementById("browse-finds")?.scrollIntoView({behavior:"smooth"});}}>Next →</button></nav>}
  <p className="hc-self-table-note">* GBP prices are indicative reference amounts, not live offers. Final product prices, agent fees, delivery and taxes may differ. Direct links identify the original marketplace listing; they are not a guarantee of supplier authenticity.</p>
 </section>;
}