"use client";
import ProductCard from "@/components/ProductCard";
import type {Product} from "@/lib/types";
import type {EnrichedPersonalProduct} from "@/lib/personal-shop-enrichment";
import {shopPrice,priceIsConverted,type ShopFxRates} from "@/lib/shop-price";

/** Both personal edits deliberately reuse the SAME card as Start a Business.
 * Only the destination, recorded price and marketplace copy differ.
 */
export default function ShopPersonalCard({product,rates,audience}:{product:EnrichedPersonalProduct;rates:ShopFxRates;audience:"women"|"men"}){
 const href="/shop-for-yourself/"+encodeURIComponent(product.id)+"?audience="+audience;
 const original=product.originalUrl.toLowerCase();
 const marketplace=original.includes("weidian.com")?"Weidian":
  original.includes("taobao.com")?"Taobao":
  original.includes("1688.com")?"1688":
  original.includes("tmall.com")?"Tmall":"Marketplace";
 const record:Product={
  doppelProductId:product.id,
  title:product.name,
  category:product.category,
  imageUrl:product.imageUrl,
  images:product.savedDetails?.photos||[],
  sellerName:product.savedDetails?.sellerName||undefined,
  variantCount:product.savedDetails?.variantCount||0,
  hasPartnerDetails:Boolean(product.savedDetails),
  sourceMarketplace:marketplace,
  originalMarketplaceUrl:product.originalUrl
 };
 const count=product.savedDetails?.variantCount||0;
 const note=count
  ?count+" recorded "+(count===1?"option":"options")+" · reference price":
  product.savedDetails?"Saved supplier details · reference price":
  priceIsConverted(product)?"Approximate GBP reference · shipping separate":
  "Reference price · delivery not included";
 return <ProductCard
   product={record}
   titleOverride={product.name}
   hrefOverride={href}
   priceOverride={shopPrice(product,rates)}
   priceNoteOverride={note}
   sourceLabelOverride={"Source: "+marketplace}
 />;
}
