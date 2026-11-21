import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ShopDetailPhoto from "@/components/ShopDetailPhoto";
import ShopPersonalCard from "@/components/ShopPersonalCard";
import {ExternalArrowIcon} from "@/components/ShopIcons";
import {findPersonalProduct,personalShopProducts,productPrice} from "@/lib/personal-shop";
import "../shop-for-yourself.css";
import "../personal-shop-v2.css";

export const dynamic="force-dynamic";
type Params={params:Promise<{id:string}>};

export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {id}=await params;
 const item=findPersonalProduct(id);
 if(!item)return {title:"Product not found | Herocon"};
 return {title:item.name+" | The Personal Edit | Herocon",description:"Explore "+item.name+" with its original marketplace listing and reference price. Supplier claims are unverified."};
}

export default async function ShopProductPage({params}:Params){
 const {id}=await params;
 const item=findPersonalProduct(id);
 if(!item)notFound();
 const gender=item.gender==="men"?"men":"women";
 const category=item.category;
 const market=item.originalUrl.includes("weidian.com")?"Weidian":item.originalUrl.includes("1688.com")?"1688":item.originalUrl.includes("taobao.com")?"Taobao":"Original marketplace";
 const related=personalShopProducts.filter(p=>p.id!==item.id&&p.category===category&&(p.gender===item.gender||p.gender==="unisex")).slice(0,4);
 return <main className="hc-self hc-self-v2">
   <Header/>
   <div className="hc-self-wrap hc-personal-detail-wrap">
     <nav className="hc-personal-breadcrumb" aria-label="Product breadcrumbs">
       <Link href="/">Herocon</Link><span>/</span>
       <Link href={"/shop-for-yourself?audience="+gender+"#browse-finds"}>Shop {gender}</Link><span>/</span>
       <Link href={"/shop-for-yourself?audience="+gender+"&category="+encodeURIComponent(category)+"#browse-finds"}>{category}</Link>
     </nav>
     <section className="hc-personal-detail" aria-labelledby="hc-personal-detail-title">
       <ShopDetailPhoto src={item.imageUrl} alt={item.name}/>
       <div className="hc-personal-detail-info">
         <span className="hc-personal-detail-kicker">THE PERSONAL EDIT / {category.toUpperCase()}</span>
         <h1 id="hc-personal-detail-title">{item.name}</h1>
         <div className="hc-personal-detail-price">{productPrice(item)}<span>Reference price, not a live quote</span></div>
         <p>Discover this piece through its original {market} listing. Review product details, available colours, sizes and current pricing with the marketplace seller before ordering.</p>
         <a className="hc-personal-detail-cta" href={item.originalUrl} target="_blank" rel="noopener noreferrer nofollow">View original {market} product <ExternalArrowIcon/></a>
         <p className="hc-personal-detail-source">This link opens the original marketplace listing, not a buying agent or Herocon checkout.</p>
         <div className="hc-personal-detail-rule"/>
         <div className="hc-personal-detail-facts">
           <div><span>Marketplace</span><strong>{market}</strong></div>
           <div><span>Collection</span><strong>{item.gender==="unisex"?"Unisex / Women & Men":item.gender==="men"?"Men":"Women"}</strong></div>
           <div><span>Product type</span><strong>{item.category}</strong></div>
         </div>
         <p className="hc-personal-detail-disclaimer">Third-party product names and images are supplier-provided. Herocon has not verified brand authenticity, seller stock, safety, quality or delivery. Prices and links may change without notice.</p>
       </div>
     </section>
     {related.length>0&&<section className="hc-personal-detail-related" aria-labelledby="hc-personal-related-title">
       <div className="hc-personal-related-heading"><div><span className="hc-personal-detail-kicker">MORE TO DISCOVER</span><h2 id="hc-personal-related-title">You might also <em>love.</em></h2></div><Link href={"/shop-for-yourself?audience="+gender+"&category="+encodeURIComponent(category)+"#browse-finds"}>Explore {category.toLowerCase()} →</Link></div>
       <div className="hc-self-grid hc-personal-grid">{related.map(p=><ShopPersonalCard product={p} key={p.id}/>)}</div>
     </section>}
   </div>
 </main>;
}
