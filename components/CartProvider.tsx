"use client";
import {validFreight} from "@/lib/cart-pricing";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {createContext,useContext,useEffect,useState,useRef} from "react";
import {useRouter,usePathname} from "next/navigation";

export type CartItem={
 key:string;
 productId:string;
 productPath:string;
 title:string;
 image?:string;
 marketplaceUrl:string;
 variant:string;
 skuCode?:string;
 source?: "hiobuy";
 quantity:number;
 unitPrice:number|null;
 currency:"CNY"|"GBP";
 domesticFreightCny?:number|null;
 /** Whether this line is part of the next order. Kept with the cart in localStorage. */
 selected?:boolean;
};
export type AccountStatus={status:"checking"|"guest"|"authenticated"|"unavailable";id?:string;email?:string;ownerPremium?:boolean;premium?:boolean;trialEndsAt?:string|null};
export const PENDING_CART_KEY="herocon-pending-add-v1";
export const cartStorageKey=(userId:string)=>"herocon-user-cart-v2:"+userId;
type CartContextValue={
 account:AccountStatus;
 refreshAccount:()=>Promise<AccountStatus>;
 items:CartItem[];
 count:number;
 hydrated:boolean;
 addItems:(items:CartItem[])=>void;
 updateQuantity:(key:string,quantity:number)=>void;
 setItemSelected:(key:string,selected:boolean)=>void;
 selectAllItems:(selected:boolean)=>void;
 removeItem:(key:string)=>void;
 clearCart:()=>void;
 updateFreight:(rates:Record<string,number|null>)=>void;
};
const STORAGE_KEY_PREFIX="herocon-user-cart-v2:";
const MAX_LINES=100;
const MAX_QUANTITY=999;
const CartContext=createContext<CartContextValue|null>(null);
const clamp=(n:number)=>Math.min(MAX_QUANTITY,Math.max(1,Math.floor(n)));
function validItem(v:unknown):v is CartItem{
 if(!v||typeof v!=="object"||Array.isArray(v))return false;
 const item=v as Record<string,unknown>;
 if(typeof item.key!=="string"||!item.key||item.key.length>1200
  ||typeof item.productPath!=="string"||!item.productPath.startsWith("/")||item.productPath.startsWith("//")
  ||typeof item.productId!=="string"||typeof item.title!=="string"||!item.title.trim()
  ||typeof item.variant!=="string"||typeof item.marketplaceUrl!=="string")return false;
 try{const url=new URL(item.marketplaceUrl);if(url.protocol!=="https:")return false;}catch{return false;}
 return (item.currency==="CNY"||item.currency==="GBP")
  &&typeof item.quantity==="number"&&Number.isFinite(item.quantity)&&item.quantity>=1
  &&(item.unitPrice===null||(typeof item.unitPrice==="number"&&Number.isFinite(item.unitPrice)&&item.unitPrice>=0))
  &&(item.selected===undefined||typeof item.selected==="boolean")
  &&(item.source===undefined||item.source==="hiobuy");
}
export function CartProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<CartItem[]>([]);
 const [hydrated,setHydrated]=useState(false);
 const [storageUserId,setStorageUserId]=useState<string|null>(null);
 const [account,setAccount]=useState<AccountStatus>({status:"checking"});
 const router=useRouter(),pathname=usePathname();
 const last=useRef<AccountStatus>({status:"checking"}),lastCheck=useRef(0),inflight=useRef<Promise<AccountStatus>|null>(null);
 function refreshAccount():Promise<AccountStatus>{
  if(inflight.current)return inflight.current;
  const work=(async()=>{try{
   const res=await fetch("/api/account/session",{cache:"no-store",credentials:"same-origin"});
   const data=await res.json();
   let next:AccountStatus;
   if(data.authenticated===true&&typeof data.user?.id==="string"&&typeof data.user?.email==="string")
    next={status:"authenticated",id:data.user.id,email:data.user.email,ownerPremium:data.user.ownerPremium===true,premium:data.user.premium===true,trialEndsAt:typeof data.user.trialEndsAt==="string"?data.user.trialEndsAt:null};
   else next={status:res.status===503?"unavailable":"guest"};
   const previous=last.current;last.current=next;lastCheck.current=Date.now();setAccount(next);
   if(data.refreshed===true||previous.status!=="checking"&&(previous.id!==next.id||previous.premium!==next.premium||previous.trialEndsAt!==next.trialEndsAt))router.refresh();
   return next;
  }catch{
   const unavailable:AccountStatus={status:"unavailable"};
   lastCheck.current=Date.now();setAccount(unavailable);return unavailable;
  }})();inflight.current=work;void work.finally(()=>{if(inflight.current===work)inflight.current=null;});return work;
 }
 useEffect(()=>{if(Date.now()-lastCheck.current>30000)void refreshAccount();},[pathname]);
 useEffect(()=>{const check=()=>{if(document.visibilityState==="visible"&&Date.now()-lastCheck.current>30000)void refreshAccount();};const timer=window.setInterval(check,120000);window.addEventListener("focus",check);document.addEventListener("visibilitychange",check);return()=>{window.clearInterval(timer);window.removeEventListener("focus",check);document.removeEventListener("visibilitychange",check);};},[]);
 useEffect(()=>{if(!account.trialEndsAt)return;const delay=Date.parse(account.trialEndsAt)-Date.now();if(delay<=0){void refreshAccount();return;}const timer=window.setTimeout(()=>void refreshAccount(),Math.min(delay+100,2147483647));return()=>window.clearTimeout(timer);},[account.trialEndsAt]);
 useEffect(()=>{
  setHydrated(false);
  if(account.status!=="authenticated"||!account.id){
   setStorageUserId(null);setItems([]);setHydrated(true);return;
  }
  let found:CartItem[]=[];
  try{
   const value:unknown=JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX+account.id)||"[]");
   if(Array.isArray(value))found=value.filter(validItem).slice(0,MAX_LINES).map(x=>({...x,quantity:clamp(x.quantity),selected:x.selected!==false}));
  }catch{}
  setItems(found);setStorageUserId(account.id);setHydrated(true);
 },[account.status,account.id]);
 useEffect(()=>{
  if(!hydrated||!storageUserId||account.status!=="authenticated"||account.id!==storageUserId)return;
  try{localStorage.setItem(STORAGE_KEY_PREFIX+storageUserId,JSON.stringify(items));}catch{}
 },[items,hydrated,storageUserId,account.status,account.id]);
 function addItems(nextItems:CartItem[]){
  if(account.status!=="authenticated"||!hydrated)return;
  setItems(previous=>{
   const map=new Map(previous.map(item=>[item.key,item]));
   for(const item of nextItems.filter(validItem)){
    const existing=map.get(item.key);
    if(existing)map.set(item.key,{...item,quantity:clamp(existing.quantity+item.quantity),domesticFreightCny:validFreight(item.domesticFreightCny)?item.domesticFreightCny:existing.domesticFreightCny,selected:existing.selected!==false});
    else if(map.size<MAX_LINES)map.set(item.key,{...item,quantity:clamp(item.quantity),selected:true});
   }
   return [...map.values()];
  });
 }
 function updateQuantity(key:string,quantity:number){
  setItems(previous=>previous.map(item=>item.key===key?{...item,quantity:clamp(quantity)}:item));
 }
 function setItemSelected(key:string,selected:boolean){
  setItems(previous=>previous.map(item=>item.key===key?{...item,selected}:item));
 }
 function selectAllItems(selected:boolean){
  setItems(previous=>previous.map(item=>item.selected===selected?item:{...item,selected}));
 }
 function removeItem(key:string){setItems(previous=>previous.filter(item=>item.key!==key));}
 function clearCart(){setItems([]);}
 const updateFreight=(rates:Record<string,number|null>)=>setItems(previous=>previous.map(i=>{const url=normalizeMarketplaceLink(i.marketplaceUrl);const fee=url?rates[url]:undefined;return validFreight(fee)?{...i,domesticFreightCny:fee}:i;}));
 const count=items.reduce((sum,item)=>sum+item.quantity,0);
 const value={items,count,hydrated,account,refreshAccount,addItems,updateQuantity,setItemSelected,selectAllItems,removeItem,clearCart,updateFreight};
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(){
 const value=useContext(CartContext);
 if(!value)throw Error("CartProvider is missing");
 return value;
}
