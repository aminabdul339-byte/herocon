import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import EnrichmentBatchRunner from "@/components/EnrichmentBatchRunner";
import {getProducts} from "@/lib/catalogue-server";
import {productId,cleanTitle} from "@/lib/catalogue";
import {personalShopProducts} from "@/lib/personal-shop";
import {unavailableSourceHashes,isUnavailableSource} from "@/lib/catalogue-unavailable";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {createHash} from "node:crypto";
import {getAllEnrichedSourceHashes,getBuckydropBulkStatus} from "@/lib/buckydrop-bulk";
import {getSavedMarketplaceSource} from "@/lib/marketplace-source-enrichment";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
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
 const [allProducts,hidden]=await Promise.all([getProducts(),unavailableSourceHashes()]);
 const personal=personalShopProducts.filter(p=>!isUnavailableSource(p.originalUrl,hidden));
 const originals=collection==="personal"?personal.map(p=>({
   id:p.id,title:p.name,sourceUrl:p.originalUrl,
   productPath:"/shop-for-yourself/"+encodeURIComponent(p.id),
   existingImages:p.imageUrl?1:0,existingVariants:0,
   hasDescription:false,hasSeller:false
  })):allProducts.map(p=>({
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
 const [saved,progress]=await Promise.all([
  getAllEnrichedSourceHashes(),getBuckydropBulkStatus()
 ]);
 const rows=await Promise.all(selected.map(async p=>{
  const link=normalizeMarketplaceLink(p.sourceUrl);
  const key=link?createHash("sha256").update(link).digest("hex"):"";
  const hasSaved=Boolean(key&&saved.has(key));
  if(!hasSaved||!link)return {...p,saved:false};
  // Display actual saved supplier counts, not the sparse imported catalogue
  // record. Reading private Blob snapshots never incurs a paid supplier call.
  const [bucky,hiobuy]=await Promise.all([
   getSavedBuckydropProduct(link).catch(()=>null),
   getSavedMarketplaceSource(link).catch(()=>null)
  ]);
  const imageCount=Math.max(p.existingImages,bucky?.images.length||0,hiobuy?.images.length||0);
  const optionsCount=Math.max(p.existingVariants,bucky?.variants.length||0,hiobuy?.variants.length||0);
  return {
   ...p,saved:true,existingImages:imageCount,existingVariants:optionsCount,
   hasDescription:Boolean(p.hasDescription||bucky?.descriptionText||hiobuy?.descriptionText),
   hasSeller:Boolean(p.hasSeller||bucky?.sellerName||hiobuy?.sellerName)
  };
 }));
 const savedUnique=progress.totalSaved;
 return <main style={{minHeight:"100vh",background:"#f8f8f3"}}>
  <Header/>
  <EnrichmentBatchRunner collection={collection} rows={rows} page={page} total={items.length}
    providerConnected={Boolean(process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP==="true"&&process.env.BUCKYDROP_APP_CODE&&process.env.BUCKYDROP_APP_SECRET&&process.env.BUCKYDROP_ENV==="live")}
    automationConfigured={Boolean(process.env.CRON_SECRET?.trim()&&process.env.BLOB_READ_WRITE_TOKEN)}
    progress={progress} uniqueSources={progress.totalKnown} savedUnique={savedUnique}/>
 </main>;
}