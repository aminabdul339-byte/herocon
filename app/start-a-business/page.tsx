import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/lib/catalogue-server";
import {enrichVisibleProductCards} from "@/lib/marketplace-source-enrichment";
import {prioritizeSavedPartnerProducts,attachSavedPartnerImages,leadWithShowcaseMix} from "@/lib/catalogue-priority";
import {productSearchScore} from "@/lib/product-search";
import {PRIMARY_CATEGORIES,resolveCategory} from "@/lib/product-taxonomy";
import type {Metadata} from "next";
import "./catalogue-first.css";

export const metadata:Metadata={
 title:"Start a Business — The Founder's Edit",
 description:"Find products, research suppliers, estimate sourcing costs and make a practical plan for your first product business with Herocon."
};

const WARDROBE_PHOTO="https://images.unsplash.com/photo-1603400521630-9f2de124b33b?auto=format&fit=crop&w=1200&q=85";

const tools=[
 {number:"01",title:"Explore products",description:"Find a niche or compare ideas across the catalogue.",href:"/search"},
 {number:"02",title:"Find a source",description:"Have a supplier URL? Start from the original listing.",href:"/find-product"},
 {number:"03",title:"Estimate your costs",description:"Work out the landed cost before setting a resale price.",href:"/landed-cost"},
 {number:"04",title:"Understand sourcing",description:"Learn what happens now and what comes next.",href:"/how-it-works"}
];
const checklist=[
 "Define your audience and a product niche",
 "Look for actual demand and relevant competitors",
 "Check product rules, safety and intellectual-property rights",
 "Research the seller and any minimum order quantities",
 "Ask about samples and available variants",
 "Estimate the full cost, including shipping, duties and fees",
 "Start small, gather feedback and refine your offer"
];

export const dynamic="force-dynamic";
const PAGE_SIZE=12;
export default async function StartBusiness({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const params=await searchParams;
 const query=(params.q||"").trim().slice(0,120);
 const requestedCategory=(params.category||"").trim();
 const category=resolveCategory(requestedCategory)||requestedCategory;
 const all=await getProducts();
 const found=all.map(product=>({product,score:productSearchScore(product,query)}))
   .filter(item=>item.score>0&&(!category||item.product.category===category))
   .sort((a,b)=>b.score-a.score)
   .map(item=>item.product);
 let catalogue=await prioritizeSavedPartnerProducts(found);
 if(!query&&!category)catalogue=leadWithShowcaseMix(catalogue);
 const total=catalogue.length;
 const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
 const requestedPage=Number.parseInt(params.page||"1",10);
 const page=Number.isFinite(requestedPage)?Math.min(pages,Math.max(1,requestedPage)):1;
 const start=(page-1)*PAGE_SIZE;
 const shown=await enrichVisibleProductCards(await attachSavedPartnerImages(catalogue.slice(start,start+PAGE_SIZE)));
 const categoryCounts=new Map<string,number>();
 for(const product of all)if(product.category)categoryCounts.set(product.category,(categoryCounts.get(product.category)||0)+1);
 const quickCategories=PRIMARY_CATEGORIES.filter(name=>categoryCounts.has(name))
   .sort((a,b)=>(categoryCounts.get(b)||0)-(categoryCounts.get(a)||0)).slice(0,6);
 const catalogueHref=(changes:{page?:number|null;category?:string|null;q?:string|null})=>{
   const next=new URLSearchParams();
   const nextQuery=changes.q!==undefined?changes.q:query;
   const nextCategory=changes.category!==undefined?changes.category:category;
   if(nextQuery)next.set("q",nextQuery);
   if(nextCategory)next.set("category",nextCategory);
   if(changes.page&&changes.page>1)next.set("page",String(changes.page));
   return "/start-a-business"+(next.toString()?"?"+next.toString():"")+"#sourcing-catalogue";
 };
 return <main className="hc-founder">
  <Header/>
  <section id="sourcing-catalogue" className="hc-founder-catalogue" aria-labelledby="hc-founder-catalogue-title">
    <div className="hc-founder-container">
      <div className="hc-founder-catalogue-heading">
        <div><span className="hc-founder-eyebrow">THE SOURCING CATALOGUE</span><h1 id="hc-founder-catalogue-title">Products worth <em>exploring.</em></h1><p>Real products from Herocon&apos;s sourcing catalogue, with links to their original marketplace listings.</p></div>
        <Link className="hc-founder-catalogue-all" href="/search">Browse the full catalogue <span aria-hidden="true"><ArrowIcon/></span></Link>
      </div>
      <form className="hc-founder-catalogue-search" role="search" action="/start-a-business#sourcing-catalogue" method="get">
        <label htmlFor="hc-founder-catalogue-query" className="hc-choice-sr-only">Search sourcing products</label>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5.5 5.5"/></svg>
        <input id="hc-founder-catalogue-query" type="search" name="q" defaultValue={query} placeholder="Search products or suppliers…" />
        {category&&<input type="hidden" name="category" value={category}/>}
        <button type="submit">Search <span aria-hidden="true"><ArrowIcon direction="right"/></span></button>
      </form>
      <nav className="hc-founder-catalogue-filters" aria-label="Sourcing product categories">
        <Link className={!category?"is-active":""} aria-current={!category?"page":undefined} href={catalogueHref({category:null,page:null})}>All products</Link>
        {quickCategories.map(name=><Link key={name} className={category===name?"is-active":""} aria-current={category===name?"page":undefined} href={catalogueHref({category:name,page:null})}>{name}</Link>)}
        {category&&!quickCategories.some(name=>name===category)&&<Link className="is-active" aria-current="page" href={catalogueHref({category,page:null})}>{category}</Link>}
      </nav>
      <div className="hc-founder-catalogue-meta"><span>{total.toLocaleString("en-GB")} {total===1?"product":"products"}{category?" · "+category:""}{query?' · Search: "'+query+'"':""}</span>{total>0&&<span>Showing {(start+1).toLocaleString("en-GB")}–{Math.min(total,start+PAGE_SIZE).toLocaleString("en-GB")}</span>}</div>
      {shown.length?
        <div className="hc-founder-catalogue-grid">{shown.map((product,i)=><ProductCard key={product.canonicalId||product.doppelProductId||i} product={product} eager={i<4}/>)}</div>:
        <div className="hc-founder-catalogue-empty"><h3>No matching products found.</h3><p>Try another search or browse all sourcing products.</p><Link href={catalogueHref({q:null,category:null,page:null})}>Show all products <ArrowIcon/></Link></div>}
      <div className="hc-founder-catalogue-bottom">
        <nav className="hc-founder-catalogue-pages" aria-label="Sourcing catalogue pagination">
          {page>1?<Link href={catalogueHref({page:page-1})}><ArrowIcon direction="left"/> Previous</Link>:<span className="hc-founder-page-disabled"><ArrowIcon direction="left"/> Previous</span>}
          <span>Page {page} of {pages}</span>
          {page<pages?<Link href={catalogueHref({page:page+1})}>Next <ArrowIcon direction="right"/></Link>:<span className="hc-founder-page-disabled">Next <ArrowIcon direction="right"/></span>}
        </nav>
        <Link className="hc-founder-catalogue-browse" href="/search">View full sourcing catalogue <span aria-hidden="true"><ArrowIcon/></span></Link>
      </div>
      <p className="hc-founder-catalogue-disclosure">Prices shown are listing references only. Shipping, taxes, seller availability and any agent charges must be checked before ordering.</p>
    </div>
  </section>

  <section className="hc-founder-section" aria-labelledby="hc-founder-tools-title">
    <div className="hc-founder-container">
      <div className="hc-founder-section-head"><div><span className="hc-founder-eyebrow">01 / YOUR STARTING POINT</span><h2 id="hc-founder-tools-title">The right tools.<br/><em>At the right time.</em></h2></div><p>Turn inspiration into research. Each tool connects to an existing part of Herocon, so you can actually take the next step.</p></div>
      <div className="hc-founder-tools">{tools.map(tool=><Link className="hc-founder-tool" href={tool.href} key={tool.number}><span>{tool.number} / EXPLORE</span><h3>{tool.title}</h3><p>{tool.description}</p><span aria-hidden="true"><ArrowIcon/></span></Link>)}</div>
    </div>
  </section>

  <section className="hc-founder-section" aria-labelledby="hc-founder-check-title">
    <div className="hc-founder-container hc-founder-list">
      <div className="hc-founder-list-photo"><img src={WARDROBE_PHOTO} alt="Real photograph of neutral garments displayed on clothing rails, suggesting a carefully selected first collection" width={760} height={950} loading="lazy" decoding="async"/></div>
      <div>
        <span className="hc-founder-eyebrow">02 / BEFORE THE FIRST ORDER</span>
        <h2 id="hc-founder-check-title" style={{font:"400 clamp(40px,4.4vw,62px)/1.06 Georgia,serif",letterSpacing:"-.05em",margin:"14px 0 0"}}>A little research.<br/><em style={{color:"#8a9c88"}}>A lot more clarity.</em></h2>
        <ol className="hc-founder-checklist">{checklist.map((item,i)=><li key={item}><span>{String(i+1).padStart(2,"0")}</span>{item}</li>)}</ol>
        <Link href="/landed-cost" className="hc-founder-cta" style={{marginTop:22}}>Calculate a landed cost <span aria-hidden="true"><ArrowIcon/></span></Link>
      </div>
    </div>
  </section>

  <section className="hc-founder-note" aria-labelledby="hc-founder-note-title"><div className="hc-founder-container hc-founder-note-grid"><div><span className="hc-founder-eyebrow">BUILD WITH GOOD INFORMATION</span><h2 id="hc-founder-note-title">The idea is yours.<br/><em>The next step is too.</em></h2></div><div><p>Today, Herocon provides product discovery and original marketplace links. Herocon-managed purchasing, warehousing, fulfilment and international shipping checkout are not yet live. Supplier quotes, stock and resale margins need to be confirmed independently before you order.</p><Link href="/how-it-works">Read how sourcing works <span aria-hidden="true"><ArrowIcon/></span></Link></div></div></section>
 </main>;
}
