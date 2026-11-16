import{redirect}from"next/navigation";
import{resolveCategory}from"@/lib/product-taxonomy";
export default async function Category({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const title=decodeURIComponent(slug).replace(/[-_]+/g," ");
 const category=resolveCategory(title);
 redirect(category?"/search?category="+encodeURIComponent(category):"/search?q="+encodeURIComponent(title));
}