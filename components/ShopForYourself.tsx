import Link from "next/link";
import ShopPersonalCard from "@/components/ShopPersonalCard";
import {ShopCategoryIcon} from "@/components/ShopIcons";
import {audienceProducts,type PersonalShopProduct} from "@/lib/personal-shop";

type Audience="women"|"men";
type Filters={audience:Audience;category:string;q:string;sort:string;page:number};
const PER_PAGE=24;
const ORDER:Record<Audience,string[]>={
 women:["Bags","Shoes","Sunglasses","Jewellery","Clothing","Accessories","Watches","Sportswear"],
 men:["Clothing","Shoes","Sunglasses","Accessories","Bags","Watches","Sportswear","Jewellery"]
};
const genderName:Record<Audience,string>={women:"women's",men:"men's"};
function nameCompare(a:PersonalShopProduct,b:PersonalShopProduct){return a.name.localeCompare(b.name,"en",{sensitivity:"base",numeric:true});}

export default function ShopForYourself({filters}:{filters:Filters}){
 const {audience,sort}=filters;
 const everything=audienceProducts(audience);
 const categoryTotals=new Map<string,number>();
 for(const x of everything)categoryTotals.set(x.category,(categoryTotals.get(x.category)||0)+1);
 const availableCategories=ORDER[audience].filter(x=>categoryTotals.has(x));
 const category=availableCategories.includes(filters.category)?filters.category:"All";
 const query=filters.q.trim().toLowerCase();
 const matching=everything.filter(x=>(category==="All"||x.category===category)&&(!query||(x.name+" "+x.category).toLowerCase().includes(query)));
 matching.sort((a,b)=>{
  if(sort==="name")return nameCompare(a,b);
  const ca=ORDER[audience].indexOf(a.category),cb=ORDER[audience].indexOf(b.category);
  return ca-cb || a.name.localeCompare(b.name,"en",{sensitivity:"base",numeric:true});
 });
 const pageCount=Math.max(1,Math.ceil(matching.length/PER_PAGE));
 const page=Math.min(pageCount,Math.max(1,filters.page));
 const shown=matching.slice((page-1)*PER_PAGE,page*PER_PAGE);
 function href(changes:Partial<Filters>){
  const p:Filters={...filters,...changes};
  const q=new URLSearchParams();
  q.set("audience",p.audience);
  if(p.category&&p.category!=="All")q.set("category",p.category);
  if(p.q)q.set("q",p.q);
  if(p.sort!=="featured")q.set("sort",p.sort);
  if(p.page>1)q.set("page",String(p.page));
  return "/shop-for-yourself?"+q.toString()+"#browse-finds";
 }
 return <section id="browse-finds" className="hc-self-listing hc-self-wrap hc-personal-catalogue" aria-labelledby="hc-self-listing-title">
  <div className="hc-personal-catalogue-intro">
    <div>
      <p className="hc-self-eyebrow">THE PERSONAL EDIT / HEROCON</p>
      <h2 id="hc-self-listing-title">Your {genderName[audience]} <em>edit.</em></h2>
      <p>Find something worth keeping. Original marketplace sources, thoughtful browsing and no unnecessary detours.</p>
    </div>
    <nav className="hc-personal-audience" aria-label="Choose who to shop for">
      {(["women","men"] as const).map(option=><Link key={option} href={href({audience:option,category:"All",q:"",page:1,sort:"featured"})} className={audience===option?"is-active":""} aria-current={audience===option?"page":undefined}>
        <span>{option==="women"?"Women":"Men"}</span><small>{audienceProducts(option).length.toLocaleString("en-GB")} finds</small>
      </Link>)}
    </nav>
  </div>
  <p className="hc-personal-shared-note"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m8 12 3 3 5-6"/></svg> Shoes, sunglasses and other unisex favourites appear in both edits.</p>
  <nav className="hc-self-categories hc-personal-categories" aria-label={"Browse "+genderName[audience]+" categories"}>
    <Link className={"hc-self-category"+(category==="All"?" hc-self-category-active":"")} href={href({category:"All",page:1})} aria-current={category==="All"?"page":undefined}>
      <span className="hc-self-category-icon"><ShopCategoryIcon category="All"/></span><span className="hc-self-category-title">All finds<small>{everything.length.toLocaleString("en-GB")} products</small></span>
    </Link>
    {availableCategories.map(cat=><Link key={cat} className={"hc-self-category"+(category===cat?" hc-self-category-active":"")} href={href({category:cat,page:1})} aria-current={category===cat?"page":undefined}>
      <span className="hc-self-category-icon"><ShopCategoryIcon category={cat}/></span>
      <span className="hc-self-category-title">{cat}<small>{(categoryTotals.get(cat)||0).toLocaleString("en-GB")} products</small></span>
    </Link>)}
  </nav>
  <form className="hc-self-toolbar hc-personal-toolbar" action="/shop-for-yourself#browse-finds" method="get">
    <input name="audience" type="hidden" value={audience}/>
    {category!=="All"&&<input name="category" type="hidden" value={category}/>}
    <label className="hc-self-search"><svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" strokeWidth="1.7" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.6"/><path d="m15.5 15.5 5 5"/></svg>
      <span className="hc-self-sr-only">Search products</span><input type="search" name="q" defaultValue={filters.q} placeholder={"Search "+genderName[audience]+" finds…"}/>
    </label>
    <label className="hc-self-sort">Sort <select name="sort" defaultValue={sort==="name"?"name":"featured"}><option value="featured">The edit</option><option value="name">Name: A to Z</option></select></label>
    <button type="submit" className="hc-personal-search-button">Search <span aria-hidden="true">→</span></button>
  </form>
  <div className="hc-self-results-caption">
    <div><strong>{matching.length.toLocaleString("en-GB")} finds</strong><span>{category==="All"?"All categories":category}</span></div>
    <span>Showing {matching.length?(page-1)*PER_PAGE+1:0}–{Math.min(page*PER_PAGE,matching.length)} of {matching.length.toLocaleString("en-GB")}</span>
  </div>
  {shown.length?
    <div className="hc-self-grid hc-personal-grid">{shown.map(p=><ShopPersonalCard key={p.id} product={p}/>)}</div>:
    <div className="hc-self-empty"><strong>No matching finds.</strong><p>Try another search or explore the full edit.</p><Link href={href({category:"All",q:"",sort:"featured",page:1})}>View all products</Link></div>}
  {pageCount>1&&<nav className="hc-self-pagination hc-personal-pagination" aria-label="Personal shop pages">
    {page>1?<Link href={href({page:page-1})}>← Previous</Link>:<span className="is-disabled">← Previous</span>}
    <span>Page {page} of {pageCount}</span>
    {page<pageCount?<Link href={href({page:page+1})}>Next →</Link>:<span className="is-disabled">Next →</span>}
  </nav>}
  <p className="hc-self-table-note">* Prices are reference amounts in the source currency (GBP, USD or CNY) and may have changed. Original listings are independently hosted. Availability, authenticity, brand permissions, delivery and fees are not guaranteed; Herocon checkout is not live.</p>
 </section>;
}
