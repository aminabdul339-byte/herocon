import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ProductExperience from "@/components/ProductExperience";
import ShopPersonalCard from "@/components/ShopPersonalCard";
import {findPersonalProduct,personalShopProducts} from "@/lib/personal-shop";
import {getPersonalShopRates} from "@/lib/personal-shop-fx";
import {priceAmountGbp,priceIsConverted,ratesDisclosure,shopPrice} from "@/lib/shop-price";
import type {Product} from "@/lib/types";
import "../shop-for-yourself.css";
import "../personal-shop-v2.css";

export const dynamic="force-dynamic";
type Params={params:Promise<{id:string}>;searchParams:Promise<{audience?:string}>};

export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {id}=await params;
 const item=findPersonalProduct(id);
 if(!item)return {title:"Product not found | Herocon"};
 return {title:item.name+" | The Personal Edit | Herocon",description:"Explore "+item.name+" with its GBP reference price and original marketplace listing."};
}

export default async function ShopProductPage({params,searchParams}:Params){
 const {id}=await params;
 const item=findPersonalProduct(id);
 if(!item)notFound();
 const search=await searchParams;
 const audience=item.gender==="unisex"
  ?(search.audience==="men"?"men":"women")
  :item.gender;
 const rates=await getPersonalShopRates();
 const price=shopPrice(item,rates);
 const amount=priceAmountGbp(item,rates);
 const product:Product={
  canonicalId:"personal:"+item.id,doppelProductId:item.id,
  title:item.name,displayTitle:item.name,originalTitle:item.name,
  category:item.category,
  imageUrl:item.imageUrl,
  images:[item.imageUrl],
  originalMarketplaceUrl:item.originalUrl,
  sourceMarketplace:item.originalUrl.includes("1688.com")?"1688":item.originalUrl.includes("taobao.com")?"Taobao":"Weidian",
  ...(amount!==null?{priceGBP:amount}:{}),
  price
 };
 const related=personalShopProducts.filter(p=>p.id!==item.id&&p.category===item.category&&(p.gender===audience||p.gender==="unisex")).slice(0,4);
 const audienceUrl="/shop-for-yourself?audience="+audience;
 return <main className="hc-self hc-self-v2 hc-personal-product-page" data-audience={audience}>
   <Header/>
   <div className="hc-self-wrap hc-personal-detail-wrap">
     <nav className="hc-personal-breadcrumb" aria-label="Product breadcrumbs">
       <Link href="/">Herocon</Link><span>/</span>
       <Link href={audienceUrl+"#browse-finds"}>{audience==="women"?"Women’s Edit":"Men’s Edit"}</Link><span>/</span>
       <Link href={audienceUrl+"&category="+encodeURIComponent(item.category)+"#browse-finds"}>{item.category}</Link>
     </nav>
     <div className="hc-personal-experience">
       <ProductExperience
         key={item.id}
         product={product}
         id={item.id}
         title={item.name}
         images={[item.imageUrl]}
         price={price}
         gbpOnly
         buckydropEnabled={false}
         sourceLookupFailed
         customProductPath={"/shop-for-yourself/"+encodeURIComponent(item.id)+"?audience="+audience}
       />
     </div>
     <aside className="hc-personal-detail-reference" aria-label="Price and marketplace notes">
       <div><strong>{priceIsConverted(item)?"Approximate GBP estimate":"Reference price in GBP"}</strong><p>{ratesDisclosure(rates)} This reference amount is not a live offer. Final prices, delivery, taxes and any agent fees may vary.</p></div>
       <div><strong>Original marketplace only</strong><p>Direct source links open the original Weidian, Taobao or 1688 listing. Herocon cannot independently confirm supplier inventory, brand authenticity or product quality.</p></div>
     </aside>
     {related.length>0&&<section className="hc-personal-detail-related" aria-labelledby="hc-personal-related-title">
       <div className="hc-personal-related-heading"><div><span className="hc-personal-detail-kicker">MORE TO DISCOVER</span><h2 id="hc-personal-related-title">You might also <em>love.</em></h2></div>
         <Link href={audienceUrl+"&category="+encodeURIComponent(item.category)+"#browse-finds"}>Explore {item.category.toLowerCase()} →</Link>
       </div>
       <div className="hc-self-grid hc-personal-grid">{related.map(p=><ShopPersonalCard product={p} rates={rates} audience={audience} key={p.id}/>)}</div>
     </section>}
   </div>
 </main>;
}
