import {redirect} from "next/navigation";

// Legacy and bookmarked Start a Business links open the full sourcing catalogue.
export default async function StartBusiness({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const next=new URLSearchParams();
 for(const key of ["q","category","page","sort","collection"]){
  const value=params[key];
  if(typeof value==="string"&&value)next.set(key,value);
 }
 redirect("/search"+(next.size?"?"+next.toString():""));
}
