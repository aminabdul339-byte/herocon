"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";

export type CartItem={
 key:string;
 productId:string;
 productPath:string;
 title:string;
 image?:string;
 marketplaceUrl:string;
 variant:string;
 skuCode?:string;
 quantity:number;
 unitPrice:number|null;
 currency:"CNY"|"GBP";
};
type CartContextValue={
 items:CartItem[];
 count:number;
 hydrated:boolean;
 addItems:(items:CartItem[])=>void;
 updateQuantity:(key:string,quantity:number)=>void;
 removeItem:(key:string)=>void;
 clearCart:()=>void;
};
const STORAGE_KEY="herocon-cart-v1";
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
  &&(item.unitPrice===null||(typeof item.unitPrice==="number"&&Number.isFinite(item.unitPrice)&&item.unitPrice>=0));
}
export function CartProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<CartItem[]>([]);
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{
  try{
   const stored:unknown=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
   if(Array.isArray(stored))setItems(stored.filter(validItem).slice(0,MAX_LINES).map(item=>({...item,quantity:clamp(item.quantity)})));
  }catch{}
  setHydrated(true);
 },[]);
 useEffect(()=>{
  if(!hydrated)return;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));}catch{}
 },[items,hydrated]);
 function addItems(nextItems:CartItem[]){
  setItems(previous=>{
   const map=new Map(previous.map(item=>[item.key,item]));
   for(const item of nextItems.filter(validItem)){
    const existing=map.get(item.key);
    if(existing)map.set(item.key,{...item,quantity:clamp(existing.quantity+item.quantity)});
    else if(map.size<MAX_LINES)map.set(item.key,{...item,quantity:clamp(item.quantity)});
   }
   return [...map.values()];
  });
 }
 function updateQuantity(key:string,quantity:number){
  setItems(previous=>previous.map(item=>item.key===key?{...item,quantity:clamp(quantity)}:item));
 }
 function removeItem(key:string){setItems(previous=>previous.filter(item=>item.key!==key));}
 function clearCart(){setItems([]);}
 const count=items.reduce((sum,item)=>sum+item.quantity,0);
 const value=useMemo(()=>({items,count,hydrated,addItems,updateQuantity,removeItem,clearCart}),[items,count,hydrated]);
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(){
 const value=useContext(CartContext);
 if(!value)throw Error("CartProvider is missing");
 return value;
}
