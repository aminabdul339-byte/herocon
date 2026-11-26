import {normalizeMarketplaceLink} from "./marketplace-links";
export type SavedFind={url:string;title:string;path:string;image?:string;seller?:string;price?:number;currency?:"CNY"|"GBP";minimum?:number;folder:string;variantCount?:number};
const text=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
const positive=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0?v:undefined;
export function cleanFind(value:unknown):SavedFind|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const v=value as Record<string,unknown>,url=normalizeMarketplaceLink(v.url),title=text(v.title,300),path=text(v.path,1000);
 if(!url||!title||!/^\/(product\/|shop-for-yourself\/|find-product\?)/.test(path)||/[\\\r\n]/.test(path))return null;
 let image:string|undefined;try{const i=new URL(text(v.image,2000),"https://herocon.store");if(i.protocol==="https:"&&!i.username&&!i.password)image=i.href;}catch{}
 return {url,title,path,image,seller:text(v.seller,150)||undefined,price:positive(v.price),currency:v.currency==="GBP"||v.currency==="CNY"?v.currency:undefined,minimum:positive(v.minimum),variantCount:positive(v.variantCount),folder:text(v.folder,60)||"My finds"};
}
export function profitEstimate(selling:number,product:number,shipping:number,other:number,feePercent:number,quantity:number){
 if(![selling,product,shipping,other,feePercent,quantity].every(Number.isFinite)||Math.min(selling,product,shipping,other,feePercent)<0||feePercent>100||quantity<1||!Number.isInteger(quantity))return null;
 const cost=product+shipping+other+selling*feePercent/100;
 return {cost,profit:selling-cost,margin:selling>0?(selling-cost)/selling*100:null,total:(selling-cost)*quantity};
}
