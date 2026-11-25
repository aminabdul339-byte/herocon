import {personalAll,personalCollectionPreview,personalCategoryPreview} from "@/lib/catalogue-access";
import CatalogueLockedPreview from "@/components/CatalogueLockedPreview";
import {FREE_PAGE_LIMIT,PERSONAL_CATEGORY_LIMIT,freePageWindow} from "@/lib/catalogue-access-model";
import {PremiumNotice} from "@/components/MembershipPlans";
import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import ShopPersonalCard from "@/components/ShopPersonalCard";
import {ShopAudienceIcon} from "@/components/ShopIcons";
import {ratesDisclosure,type ShopFxRates} from "@/lib/shop-price";
import {audienceProducts,type PersonalShopProduct} from "@/lib/personal-shop";
import {enrichPersonalCards} from "@/lib/personal-shop-enrichment";
import {mixPersonalEdit} from "@/lib/personal-shop-edit";
import {unavailableSourceHashes,isUnavailableSource} from "@/lib/catalogue-unavailable";

type Audience="women"|"men";
type Filters={audience:Audience;category:string;q:string;sort:string;page:number};
const PER_PAGE=24;
const ORDER:Record<Audience,string[]>={
 women:["Bags","Sunglasses","Jewellery","Shoes","Accessories","Watches"],
 men:["Clothing","Shoes","Sunglasses","Accessories","Bags","Watches","Jewellery"]
};
const genderName:Record<Audience,string>={women:"women's",men:"men's"};
function nameCompare(a:PersonalShopProduct,b:PersonalShopProduct){return a.name.localeCompare(b.name,"en",{sensitivity:"base",numeric:true});}

export default async function ShopForYourself({filters,rates,premium}:{filters:Filters;rates:ShopFxRates;premium:boolean}){
 const {audience,sort}=filters;
 const hidden=await unavailableSourceHashes();
 const [women,men]=await Promise.all([personalAll("women"),personalAll("men")]);
 const available=(a:Audience)=>a==="women"?women:men;
 const everything=available(audience);
 const categoryTotals=new Map<string,number>();
 for(const x of everything)categoryTotals.set(x.category,(categoryTotals.get(x.category)||0)+1);
 const availableCategories=ORDER[audience].filter(x=>categoryTotals.has(x));
 const category=availableCategories.includes(filters.category)?filters.category:"All";
 const query=filters.q.trim().toLowerCase();
 const limitedCategory=category!=="All";
 const totalMatches=everything.filter(x=>!limitedCategory||x.category===category).length;
 const source=premium?everything:limitedCategory?await personalCategoryPreview(audience,category):await personalCollectionPreview(audience);
 let matching=source.filter(x=>(category==="All"||x.category===category)&&(!query||(x.name+" "+x.category).toLowerCase().includes(query)));
 matching.sort((a,b)=>{
  if(sort==="name")return nameCompare(a,b);
  const ca=ORDER[audience].indexOf(a.category),cb=ORDER[audience].indexOf(b.category);
  return ca-cb || a.name.localeCompare(b.name,"en",{sensitivity:"base",numeric:true});
 });
 if(category==="All"&&!query&&sort==="featured")matching=mixPersonalEdit(matching,audience);
 const window=freePageWindow(filters.page,totalMatches,limitedCategory,PERSONAL_CATEGORY_LIMIT);
 const pageCount=premium?Math.max(1,Math.ceil(matching.length/PER_PAGE)):window.pages;
 const page=premium?Math.min(pageCount,Math.max(1,filters.page)):window.page;
 const locked=!premium&&window.locked;
 const visible=locked?[]:premium?matching.slice((page-1)*PER_PAGE,page*PER_PAGE):matching.slice(window.start,window.end);
 const shown=await enrichPersonalCards(visible);
 const showLock=!premium&&(locked||limitedCategory&&totalMatches>visible.length||!limitedCategory&&page===FREE_PAGE_LIMIT&&window.hasLocked);
 const remaining=limitedCategory?Math.max(0,totalMatches-visible.length):Math.max(0,totalMatches-Math.min(totalMatches,FREE_PAGE_LIMIT*PER_PAGE));
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
      <p className="hc-self-eyebrow">THE PERSONAL EDIT <span className="hc-personal-kicker-mark">/</span> {audience==="women"?"WOMEN":"MEN"}</p>
      <h1 id="hc-self-listing-title">Shop for <em>{audience==="women"?"women.":"men."}</em></h1>
      <p>{audience==="women"?"Handbags, jewellery, shoes and accessories — all with original marketplace links.":"Clothing, footwear and accessories — curated from original marketplace sources."}</p>
    </div>
    <nav className="hc-personal-audience" aria-label="Choose who to shop for">
      {(["women","men"] as const).map(option=><Link key={option} href={href({audience:option,category:"All",q:"",page:1,sort:"featured"})} className={audience===option?"is-active":""} aria-current={audience===option?"page":undefined}>
        <span className="hc-personal-audience-title"><ShopAudienceIcon audience={option}/><strong>{option==="women"?"Shop women":"Shop men"}</strong></span><small>{available(option).length.toLocaleString("en-GB")} finds</small>
      </Link>)}
    </nav>
  </div>
  {premium?<form className="hc-personal-catalogue-search" role="search" action="/shop-for-yourself#browse-finds" method="get">
    <input name="audience" type="hidden" value={audience}/>
    {category!=="All"&&<input name="category" type="hidden" value={category}/>}
    {sort==="name"&&<input name="sort" type="hidden" value="name"/>}
    <label htmlFor="hc-personal-catalogue-query" className="hc-self-sr-only">Search products</label>
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5.5 5.5"/></svg>
    <input id="hc-personal-catalogue-query" type="search" name="q" defaultValue={filters.q} placeholder="Search products…" />
    <button type="submit">Search <span aria-hidden="true"><ArrowIcon direction="right"/></span></button>
  </form>:<PremiumNotice feature="keyword search and the full collection"/>}
  <div className="hc-personal-category-heading"><span>SHOP BY CATEGORY</span><span>{everything.length.toLocaleString("en-GB")} {audience==="women"?"women’s":"men’s"} finds</span></div>
  <nav className="hc-self-categories hc-personal-categories" aria-label={"Browse "+genderName[audience]+" categories"}>
    <Link className={"hc-self-category"+(category==="All"?" hc-self-category-active":"")} href={href({category:"All",page:1})} aria-current={category==="All"?"page":undefined}>
      <span className="hc-self-category-title">All products <small>{everything.length.toLocaleString("en-GB")}</small></span>
    </Link>
    {availableCategories.map(cat=><Link key={cat} className={"hc-self-category"+(category===cat?" hc-self-category-active":"")} href={href({category:cat,page:1})} aria-current={category===cat?"page":undefined}>
      <span className="hc-self-category-title">{cat} <small>{categoryTotals.get(cat)?.toLocaleString("en-GB")}</small></span>
    </Link>)}
  </nav>
  <div className="hc-self-results-caption hc-personal-catalogue-meta">
    <span><strong>{(premium?matching.length:totalMatches).toLocaleString("en-GB")} products</strong>{category!=="All"?" · "+category:""}{query?' · Search: "'+filters.q.trim()+'"':""}</span>
    {visible.length>0&&<span>{!premium&&limitedCategory?"Free category preview":"Showing "+((page-1)*PER_PAGE+1).toLocaleString("en-GB")+"–"+Math.min((page-1)*PER_PAGE+visible.length,premium?matching.length:totalMatches).toLocaleString("en-GB")}</span>}
  </div>
  {shown.length?
    <div className={"hc-self-grid hc-personal-grid"+(!premium&&limitedCategory?" hc-free-category":"")}>{shown.map(p=><ShopPersonalCard key={p.id} product={p} rates={rates} audience={audience}/>)}</div>:
    locked?null:<div className="hc-self-empty"><strong>No matching finds.</strong><p>Try another search or explore the full collection.</p><Link href={href({category:"All",q:"",sort:"featured",page:1})}>View all products</Link></div>}
  {showLock&&<CatalogueLockedPreview personal category={limitedCategory} remaining={locked?Math.max(1,remaining):remaining}/>}
  {!premium&&limitedCategory&&!showLock&&totalMatches>4&&<CatalogueLockedPreview personal category compactOnly remaining={totalMatches-4}/>}
  {pageCount>1&&<nav className="hc-self-pagination hc-personal-pagination" aria-label="Personal shop pages">
    {page>1?<Link href={href({page:locked?(limitedCategory?1:Math.min(FREE_PAGE_LIMIT,pageCount)):page-1})}><ArrowIcon direction="left"/> Previous</Link>:<span className="is-disabled"><ArrowIcon direction="left"/> Previous</span>}
    <span>Page {page} of {pageCount}</span>
    {page<pageCount?(premium||!limitedCategory&&page<FREE_PAGE_LIMIT?<Link href={href({page:page+1})}>Next <ArrowIcon direction="right"/></Link>:<Link href="/membership">Unlock more <ArrowIcon direction="right"/></Link>):<span className="is-disabled">Next <ArrowIcon direction="right"/></span>}
  </nav>}
  <p className="hc-self-table-note">* All prices shown are GBP estimates. {ratesDisclosure(rates)} Original listings are independently hosted. Availability, authenticity, brand permissions, delivery and fees are not guaranteed; Herocon checkout is not live.</p>
 </section>;
}
