import Link from "next/link";
import Header from "@/components/Header";
import { getProducts } from "@/lib/catalogue-server";
export default async function CategoriesPage(){
  const products=await getProducts();
  const counts=new Map<string,number>();
  for(const p of products){if(p.category?.trim())counts.set(p.category,(counts.get(p.category)||0)+1)}
  const categories=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
  return <main><Header/><header className="search-intro"><p className="eyebrow">EXPLORE THE CATALOGUE</p><h1>Shop by category.</h1><p>Choose a category to browse matching products.</p></header><section className="section"><div className="category-grid">{categories.map(([name,count],i)=><Link key={name} className={"category-block c"+(i%4)} href={"/search?category="+encodeURIComponent(name)}><span>{count.toLocaleString()} PRODUCTS</span><h3>{name}</h3></Link>)}</div>{categories.length===0&&<p>No categories are available yet. <Link href="/search">Browse all products →</Link></p>}</section></main>
}