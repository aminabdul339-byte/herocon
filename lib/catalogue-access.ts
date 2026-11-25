import "server-only";
import {cache} from "react";
import {currentCustomer} from "@/lib/customer-auth";
import {membershipEntitlement} from "@/lib/membership-access";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {audienceProducts,type PersonalShopProduct} from "@/lib/personal-shop";
import {unavailableSourceHashes,isUnavailableSource} from "@/lib/catalogue-unavailable";
import {freeBusinessEdit,rankBusinessCategory,earlyBusinessEdit} from "@/lib/business-catalogue-edit";
import {prioritizeJewelleryDiscovery} from "@/lib/jewellery-discovery-order";
import {prioritizeHairDiscovery} from "@/lib/hair-discovery-order";
import {mixPersonalEdit} from "@/lib/personal-shop-edit";
import {FREE_COLLECTION_LIMIT,featuredPreviewIds,BUSINESS_CATEGORY_LIMIT,PERSONAL_CATEGORY_LIMIT} from "@/lib/catalogue-access-model";
export const catalogueAccess=cache(async()=>{const customer=await currentCustomer();return {customer,...(customer?await membershipEntitlement(customer):{premium:false,trialEndsAt:null})};});
export const businessPreview=cache(async()=>freeBusinessEdit(await getProducts(),FREE_COLLECTION_LIMIT));
export const businessCategoryPreview=cache(async(name:string)=>{
 const full=await getProducts();const all=full.filter(p=>p.category===name);const preferred=earlyBusinessEdit(full).filter(p=>p.category===name);const ranked=[...new Map([...preferred,...rankBusinessCategory(all)].map(p=>[productId(p),p])).values()];
 return (name==="Jewellery"?prioritizeJewelleryDiscovery(ranked):name==="Wigs & Hair Extensions"?prioritizeHairDiscovery(ranked):ranked).slice(0,BUSINESS_CATEGORY_LIMIT);
});
export const accessibleBusinessProducts=cache(async()=>{const all=await getProducts();if((await catalogueAccess()).premium)return all;
 const categories=await Promise.all([...new Set(all.map(p=>p.category||""))].map(businessCategoryPreview));const preview=await businessPreview();
 // Keep explicitly selected homepage products available without changing the free catalogue edit.
 const featured=all.filter(p=>featuredPreviewIds.some(id=>id===productId(p)));
 return [...new Map([...preview,...categories.flat(),...featured].map(p=>[productId(p),p])).values()];
});
export const personalAll=cache(async(audience:"women"|"men")=>{const hidden=await unavailableSourceHashes();return audienceProducts(audience).filter(p=>!isUnavailableSource(p.originalUrl,hidden));});
const personalOrder={women:["Bags","Sunglasses","Jewellery","Shoes","Accessories","Watches"],men:["Clothing","Shoes","Sunglasses","Accessories","Bags","Watches","Jewellery"]};
const nameCompare=(a:PersonalShopProduct,b:PersonalShopProduct)=>a.name.localeCompare(b.name,"en",{sensitivity:"base",numeric:true});
export const personalCollectionPreview=cache(async(audience:"women"|"men")=>mixPersonalEdit([...await personalAll(audience)].sort((a,b)=>personalOrder[audience].indexOf(a.category)-personalOrder[audience].indexOf(b.category)||nameCompare(a,b)),audience).slice(0,FREE_COLLECTION_LIMIT));
export const personalCategoryPreview=cache(async(audience:"women"|"men",name:string)=>{
 const preferred=(await personalCollectionPreview(audience)).filter(p=>p.category===name);
 const rest=(await personalAll(audience)).filter(p=>p.category===name).sort(nameCompare);
 return [...new Map([...preferred,...rest].map(p=>[p.id,p])).values()].slice(0,PERSONAL_CATEGORY_LIMIT);
});
export const personalPreview=cache(async(audience:"women"|"men")=>{const all=await personalAll(audience);return [...new Map([...(await personalCollectionPreview(audience)),...(await Promise.all([...new Set(all.map(p=>p.category))].map(c=>personalCategoryPreview(audience,c)))).flat()].map(p=>[p.id,p])).values()];});
