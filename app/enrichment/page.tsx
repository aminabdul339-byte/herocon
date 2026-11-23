import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import EnrichmentBatchRunner from "@/components/EnrichmentBatchRunner";
import {getProducts} from "@/lib/catalogue-server";
import {productId,cleanTitle} from "@/lib/catalogue";
import {personalShopProducts} from "@/lib/personal-shop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getSavedMarketplaceSource} from "@/lib/marketplace-source-enrichment";
import {currentCustomer} from "@/lib/customer-auth";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Catalogue enrichment | Herocon owner"};
export default async function EnrichmentPage({
 searchParams
}:{searchParams:Promise<{collection?:string;page?:string}>}){
 const customer=await currentCustomer();
 const ownerId=process.env.HEROCON_TRIAL_OWNER_USER_ID?.trim()
   ||process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID?.trim();
 const owner=Boolean(ownerId&&customer?.id===ownerId);
 if(!owner)return <main><Header/><section style={{maxWidth:800,padding:"60px 22px",margin:"0 auto"}}>
  <h1>Herocon owner tools</h1><p>Sign in with the Herocon owner account to access catalogue enrichment.</p>
  <Link href="/account?next=%2Fenrichment">Sign in</Link>
 </section></main>;
 const query=await searchParams;
 const collection=query.collection==="personal"?"personal":"business";
 const originals=collection==="personal"?personalShopProducts.map(p=>({
   id:p.id,title:p.name,sourceUrl:p.originalUrl,
   productPath:"/shop-for-yourself/"+encodeURIComponent(p.id),
   existingImages:p.imageUrl?1:0,existingVariants:0,
   hasDescription:false,hasSeller:false
  })):(await getProducts()).map(p=>({
   id:productId(p),title:cleanTitle(p),sourceUrl:p.originalMarketplaceUrl||"",
   productPath:"/product/"+encodeURIComponent(productId(p)),
   existingImages:(p.images?.length||0)+(p.imageUrl?1:0),
   existingVariants:p.variants?.length||0,
   hasDescription:Boolean(p.descriptionText),hasSeller:Boolean(p.sellerName)
  }));
 const items=originals.filter(p=>/^[A-Za-z0-9_-]{5,100}$/.test(p.id)&&Boolean(normalizeMarketplaceLink(p.sourceUrl)));
 const pageCount=Math.max(1,Math.ceil(items.length/12));
 const requested=Number.parseInt(query.page||"1",10);
 const page=Number.isFinite(requested)?Math.max(1,Math.min(pageCount,requested)):1;
 const selected=items.slice((page-1)*12,page*12);
 const rows=await Promise.all(selected.map(async p=>({
   ...p,saved:Boolean(await getSavedMarketplaceSource(p.sourceUrl))
 })));
 return <main style={{minHeight:"100vh",background:"#f8f8f3"}}>
  <Header/>
  <EnrichmentBatchRunner collection={collection} rows={rows} page={page} total={items.length}
    providerConnected={Boolean(process.env.HIOBUY_API_KEY?.trim())}/>
 </main>;
}