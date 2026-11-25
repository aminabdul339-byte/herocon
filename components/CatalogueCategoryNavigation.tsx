"use client";
import Link,{useLinkStatus} from "next/link";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState,useTransition,type ReactNode} from "react";
function CategoryPending(){const {pending}=useLinkStatus();return pending?<span className="sc-category-pending" role="status" aria-label="Loading category"/>:null;}
export function CatalogueCategoryLink({href,active,children}:{href:string;active:boolean;children:ReactNode}){
 return <Link href={href} scroll={false} prefetch={false} aria-current={active?"page":undefined} className={active?"sc-filter-active":""}>{children}<CategoryPending/></Link>;
}
export function CatalogueCategoryScroll({category}:{category:string}){
 const previous=useRef(category);
 useEffect(()=>{
  if(previous.current===category)return;
  previous.current=category;
  const results=document.getElementById("catalogue-results");
  if(!results)return;
  const top=results.getBoundingClientRect().top+window.scrollY;
  const header=document.querySelector("header");
  const offset=Math.max(96,(header?.getBoundingClientRect().height||0)+16);
  if(window.scrollY>top-offset)window.scrollTo({top:Math.max(0,top-offset),behavior:"instant"});
 },[category]);
 return null;
}
export function CatalogueMobileCategory({category,collection,query,sort,categories}:{category:string;collection:string;query:string;sort:string;categories:{name:string;count:number}[]}){
 const router=useRouter();
 const [selected,setSelected]=useState(category);
 const [pending,startTransition]=useTransition();
 return <form className="sc-category-mobile" action="/search" method="get" aria-busy={pending} onSubmit={e=>{
  e.preventDefault();
  const params=new URLSearchParams();
  if(selected)params.set("category",selected);
  if(collection)params.set("collection",collection);
  if(query)params.set("q",query);
  if(sort!=="recommended")params.set("sort",sort);
  startTransition(()=>router.push("/search"+(params.size?"?"+params.toString():""),{scroll:false}));
 }}>
 <label htmlFor="mobile-category-select">Browse a category</label>
 <select id="mobile-category-select" name="category" value={selected} onChange={e=>setSelected(e.target.value)} disabled={pending}><option value="">All categories</option>{categories.map(c=><option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}</select>
 {collection&&<input type="hidden" name="collection" value={collection}/>}
 {query&&<input type="hidden" name="q" value={query}/>}
 {sort!=="recommended"&&<input type="hidden" name="sort" value={sort}/>}
 <button type="submit" disabled={pending}>{pending?"Loading…":"Show products"}</button>
 </form>;
}
