"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type {CSSProperties} from "react";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useCart} from "@/components/CartProvider";
import {productBuyNowDestination} from "@/lib/product-buy-now";
export default function ProductBuyNowLink({className,style,arrow=false}:{className?:string;style?:CSSProperties;arrow?:boolean}){
 const {account,refreshAccount}=useCart();const router=useRouter();
 return <Link className={className} style={style} href={productBuyNowDestination(account.status)} onClick={async e=>{
  if(account.status!=="checking"||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  e.preventDefault();const verified=await refreshAccount();router.push(productBuyNowDestination(verified.status));
 }}>Buy now{arrow&&<> <ArrowIcon direction="right"/></>}</Link>;
}
