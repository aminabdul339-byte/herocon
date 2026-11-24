"use client";
import {useRouter} from "next/navigation";
import {useState,useTransition} from "react";

const options=[
 {value:"recommended",label:"Relevant"},
 {value:"newest",label:"Newest added"},
 {value:"price-asc",label:"Price: low to high"},
 {value:"price-desc",label:"Price: high to low"}
];

export default function CatalogueSort({sort,query,category,collection}:{sort:string;query:string;category:string;collection:string}){
 const router=useRouter();
 const [selected,setSelected]=useState(options.some(o=>o.value===sort)?sort:"recommended");
 const [pending,startTransition]=useTransition();
 function change(value:string){
  if(value===selected)return;
  setSelected(value);
  const params=new URLSearchParams();
  if(query)params.set("q",query);
  if(category)params.set("category",category);
  if(collection)params.set("collection",collection);
  if(value!=="recommended")params.set("sort",value);
  const suffix=params.toString();
  startTransition(()=>router.push("/search"+(suffix?"?"+suffix:""),{scroll:false}));
 }
 return <div className="sc-sort-control" aria-busy={pending}>
  <label htmlFor="sc-sort">Sort by</label>
  <div className="sc-sort-select">
   <select id="sc-sort" name="sort" value={selected} onChange={e=>change(e.target.value)} disabled={pending}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
   </select>
   <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  </div>
  {pending&&<span className="sc-sort-status" role="status">Updating results…</span>}
 </div>;
}
