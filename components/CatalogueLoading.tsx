import Header from "@/components/Header";
import "./catalogue-loading.css";
export function CatalogueGridSkeleton({personal=false}:{personal?:boolean}){
 return <div className={personal?"hc-self-grid hc-personal-grid hc-catalogue-skeleton":"sc-results-grid hc-catalogue-skeleton"} aria-busy="true" aria-label="Loading products">
  {Array.from({length:8},(_,i)=><div key={i} className="hc-catalogue-placeholder" aria-hidden="true"><div/><span/><span/><span/></div>)}
 </div>;
}
export default function CatalogueLoading({personal=false}:{personal?:boolean}){
 return <main className={personal?"hc-self hc-self-v2":"sc-catalogue-page"}>
  <Header/><section className="hc-catalogue-loading-shell" aria-busy="true">
   <p className="sc-kicker">{personal?"THE PERSONAL EDIT":"THE SOURCING CATALOGUE"}</p>
   <h1>{personal?"Shop for yourself.":"Discover your next opportunity."}</h1>
   <p role="status">Loading the catalogue…</p>
   <CatalogueGridSkeleton personal={personal}/>
  </section>
 </main>;
}
