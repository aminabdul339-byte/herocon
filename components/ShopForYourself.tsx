"use client";
import {useMemo,useState} from "react";

type AdditionalLink={label:string;url:string};
type ShopItem={
 id:string; name:string; category:string; priceCny:number|null; approxGbp:number|null;
 shopUrl:string|null; originalUrl:string|null; additionalLinks:AdditionalLink[]; sourceUrl:string
};
const CATEGORY_INFO=[
 {value:"All",label:"All finds",icon:"✳",number:"00"},
 {value:"Shoes",label:"Shoes",icon:"👟",number:"01"},
 {value:"Tops",label:"Tops",icon:"👕",number:"02"},
 {value:"Bottoms & shorts",label:"Bottoms & shorts",icon:"👖",number:"03"},
 {value:"Jackets & coats",label:"Jackets & coats",icon:"🧥",number:"04"},
 {value:"Accessories",label:"Accessories",icon:"🕶",number:"05"}
] as const;
const PER_PAGE=36;
const countLinked=(p:ShopItem)=>Boolean(p.shopUrl)||p.additionalLinks.length>0;
const priceFormat=(v:number)=>"¥"+v.toLocaleString("en-GB",{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2});
const gbpFormat=(v:number)=>"£"+v.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
const thumbKind=(value:string)=>{
 if(value==="Shoes")return "shoes";
 if(value==="Tops")return "tops";
 if(value==="Bottoms & shorts")return "bottoms";
 if(value==="Jackets & coats")return "jackets";
 return "accessories";
};

export default function ShopForYourself({products}:{products:ShopItem[]}){
 const [category,setCategory]=useState("All");
 const [query,setQuery]=useState("");
 const [sort,setSort]=useState("original");
 const [linksOnly,setLinksOnly]=useState(false);
 const [page,setPage]=useState(1);
 const totals=useMemo(()=>{
  const counts:Record<string,number>={All:products.length};
  for(const item of products)counts[item.category]=(counts[item.category]||0)+1;
  return counts;
 },[products]);
 const filtered=useMemo(()=>{
  const q=query.toLocaleLowerCase().trim();
  const items=products.filter(p=>(category==="All"||p.category===category)&&(!linksOnly||countLinked(p))&&(!q||(p.name+" "+p.category).toLocaleLowerCase().includes(q)));
  if(sort==="price-low")items.sort((a,b)=>(a.priceCny??Number.POSITIVE_INFINITY)-(b.priceCny??Number.POSITIVE_INFINITY));
  if(sort==="price-high")items.sort((a,b)=>(b.priceCny??Number.NEGATIVE_INFINITY)-(a.priceCny??Number.NEGATIVE_INFINITY));
  if(sort==="name")items.sort((a,b)=>a.name.localeCompare(b.name));
  return items;
 },[products,category,query,sort,linksOnly]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
 const currentPage=Math.min(page,totalPages);
 const visible=filtered.slice((currentPage-1)*PER_PAGE,currentPage*PER_PAGE);
 const resetPage=()=>setPage(1);
 return <section id="browse-finds" className="hc-self-listing hc-self-wrap" aria-labelledby="hc-self-listing-title">
  <div className="hc-self-section-head"><div><p className="hc-self-eyebrow">THE FULL EDIT / 05 COLLECTIONS</p><h2 id="hc-self-listing-title">Find your <em>favourite.</em></h2></div><p>Browse every item from the source spreadsheet. Original shopping destinations are preserved where supplied.</p></div>
  <nav className="hc-self-categories" aria-label="Shop for Yourself categories">
   {CATEGORY_INFO.map(cat=><button key={cat.value} type="button" className={"hc-self-category"+(category===cat.value?" hc-self-category-active":"")} onClick={()=>{setCategory(cat.value);resetPage();}} aria-pressed={category===cat.value}>
     <span className="hc-self-category-icon" aria-hidden="true">{cat.icon}</span><span className="hc-self-category-title">{cat.label}<small>{(totals[cat.value]||0).toLocaleString("en-GB")} finds</small></span><span className="hc-self-category-number">{cat.number}</span>
    </button>)}
  </nav>
  <div className="hc-self-toolbar">
   <label className="hc-self-search"><svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" strokeWidth="1.7" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.6"/><path d="m15.5 15.5 5 5"/></svg><span className="hc-self-sr-only">Search products</span><input value={query} placeholder="Search by product name…" onChange={e=>{setQuery(e.target.value);resetPage();}}/></label>
   <label className="hc-self-linked-filter"><input type="checkbox" checked={linksOnly} onChange={e=>{setLinksOnly(e.target.checked);resetPage();}}/> External links only</label>
   <label className="hc-self-sort">Sort <select value={sort} onChange={e=>{setSort(e.target.value);resetPage();}}><option value="original">Spreadsheet order</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label>
  </div>
  <div className="hc-self-results-caption" aria-live="polite"><div><strong>{filtered.length.toLocaleString("en-GB")} results</strong><span>{category==="All"?"All categories":category}</span></div><span>Showing {filtered.length?(currentPage-1)*PER_PAGE+1:0}–{Math.min(currentPage*PER_PAGE,filtered.length)} of {filtered.length.toLocaleString("en-GB")}</span></div>
  {visible.length?<div className="hc-self-grid">
   {visible.map((p)=>{
    const catInfo=CATEGORY_INFO.find(c=>c.value===p.category);
    return <article className="hc-self-item" key={p.id}>
     <div className={"hc-self-thumbnail hc-self-thumbnail-"+thumbKind(p.category)}>
      <div className="hc-self-thumb-noise" aria-hidden="true"></div>
      <span className="hc-self-thumb-emoji" aria-hidden="true">{catInfo?.icon||"✦"}</span>
      <span className="hc-self-thumb-label">{p.category}</span>
      <span className="hc-self-thumb-index" aria-hidden="true">{p.id.split("-").pop()}</span>
     </div>
     <div className="hc-self-item-body">
      <p className="hc-self-item-category">{p.category} <span>·</span> EXTERNAL FIND</p>
      <h3>{p.name}</h3>
      <div className="hc-self-item-price">{p.priceCny!==null?<><strong>{priceFormat(p.priceCny)}</strong>{p.approxGbp!==null&&<span>approx. {gbpFormat(p.approxGbp)}*</span>}</>:<span className="hc-self-price-missing">Price not supplied</span>}</div>
      <div className="hc-self-item-actions">
       {p.shopUrl?<a href={p.shopUrl} target="_blank" rel="noopener noreferrer nofollow sponsored" className="hc-self-link-primary">View shopping link <span aria-hidden="true">↗</span></a>:<span className="hc-self-no-link">No main shopping link listed</span>}
       {p.originalUrl&&<a href={p.originalUrl} target="_blank" rel="noopener noreferrer nofollow" className="hc-self-link-secondary">Original marketplace ↗</a>}
       {p.additionalLinks.map((extra,i)=><a key={extra.url+i} href={extra.url} target="_blank" rel="noopener noreferrer nofollow" className="hc-self-link-secondary">Additional spreadsheet link ↗</a>)}
       {!p.shopUrl&&!p.additionalLinks.length&&<a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="hc-self-link-secondary">Check source row ↗</a>}
      </div>
     </div>
    </article>;
   })}
  </div>:<div className="hc-self-empty"><strong>No matching finds.</strong><p>Try another search or clear the category and link filters.</p><button onClick={()=>{setQuery("");setCategory("All");setLinksOnly(false);resetPage();}}>Clear filters</button></div>}
  {totalPages>1&&<nav className="hc-self-pagination" aria-label="Product results pages"><button type="button" disabled={currentPage<=1} onClick={()=>{setPage(currentPage-1);document.getElementById("browse-finds")?.scrollIntoView({behavior:"smooth"});}}>← Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage>=totalPages} onClick={()=>{setPage(currentPage+1);document.getElementById("browse-finds")?.scrollIntoView({behavior:"smooth"});}}>Next →</button></nav>}
  <p className="hc-self-table-note">* GBP equivalents are estimates copied from spreadsheet calculations, not live exchange rates. Prices exclude domestic and international shipping, fees and taxes. A missing shopping link has not been replaced or guessed.</p>
 </section>;
}