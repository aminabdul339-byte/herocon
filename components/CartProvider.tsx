"use client";
import {createContext,useContext,useEffect,useState} from "react";

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
 /** Whether this line is part of the next order. Kept with the cart in localStorage. */
 selected?:boolean;
};
export type AccountStatus={status:"checking"|"guest"|"authenticated"|"unavailable";id?:string;email?:string;ownerPremium?:boolean};
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
 async function refreshAccount():Promise<AccountStatus>{
  try{
   const res=await fetch("/api/account/session",{cache:"no-store",credentials:"same-origin"});
   const data=await res.json();
   let next:AccountStatus;
   if(data.authenticated===true&&typeof data.user?.id==="string"&&typeof data.user?.email==="string")
    next={status:"authenticated",id:data.user.id,email:data.user.email,ownerPremium:data.user.ownerPremium===true};
   else next={status:res.status===503?"unavailable":"guest"};
   setAccount(next);return next;
  }catch{
   const unavailable:AccountStatus={status:"unavailable"};
   setAccount(unavailable);
   return unavailable;
  }
 }
 useEffect(()=>{void refreshAccount();},[]);
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
    if(existing)map.set(item.key,{...item,quantity:clamp(existing.quantity+item.quantity),selected:existing.selected!==false});
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
 const count=items.reduce((sum,item)=>sum+item.quantity,0);
 const value={items,count,hydrated,account,refreshAccount,addItems,updateQuantity,setItemSelected,selectAllItems,removeItem,clearCart};
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(){
 const value=useContext(CartContext);
 if(!value)throw Error("CartProvider is missing");
 return value;
}
