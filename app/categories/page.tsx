import Link from "next/link";
import Header from "@/components/Header";
import { getProducts } from "@/lib/catalogue-server";
export default async function CategoriesPage(){
  const products=await getProducts();
  const counts=new Map<string,{count:number;image?:string}>();
  for(const p of products){if(!p.category?.trim())continue;const entry=counts.get(p.category)||{count:0,image:undefined};entry.count++;if(!entry.image&&p.imageUrl)entry.image=p.imageUrl;counts.set(p.category,entry)}
  const categories=[...counts.entries()].sort((a,b)=>b[1].count-a[1].count);
  return <main><Header/><header className="search-intro"><p className="eyebrow">EXPLORE THE CATALOGUE</p><h1>Shop by category.</h1><p>Choose a category to browse matching products.</p></header><section className="section"><div className="category-grid">{categories.map(([name,entry],i)=><Link key={name} className={"category-block c"+(i%4)} href={"/search?category="+encodeURIComponent(name)}>{entry.image&&<img className="category-photo" src={entry.image} alt="" loading="lazy"/>}<span>{entry.count.toLocaleString()} PRODUCTS</span><h3>{name}</h3></Link>)}</div>{categories.length===0&&<p>No categories are available yet. <Link href="/search">Browse all products →</Link></p>}</section></main>
}