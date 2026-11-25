"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useCart} from "@/components/CartProvider";
import styles from "./shopping-center.module.css";
const tabs=[
 {name:"Cart",href:"/cart",path:"M3 4h2l2.3 11h12l2-8H6M9 20h.01M18 20h.01"},
 {name:"Orders",href:"/orders",path:"M7 3h10v4h3v14H4V7h3zM7 7h10M8 12h8M8 16h6"},
 {name:"Warehouse",href:"/warehouse",path:"M3 21V9l9-6 9 6v12M7 21V11h10v10M7 15h10M7 18h10"},
 {name:"Parcels",href:"/parcels",path:"M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M7.5 5l9 4"}
];
export default function ShoppingCenterNav(){
 const pathname=usePathname();const {count}=useCart();
 return <div className={styles.outer}><div className={styles.inner}><div className={styles.heading}><span>YOUR ACCOUNT</span><Link href="/account">Account settings</Link></div><nav className={styles.nav} aria-label="Shopping account">{tabs.map(t=><Link className={styles.tab} key={t.href} href={t.href} aria-current={pathname===t.href?"page":undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.path}/></svg><span>{t.name}</span>{t.href==="/cart"&&count>0&&<small>{count}</small>}</Link>)}</nav></div></div>;
}
