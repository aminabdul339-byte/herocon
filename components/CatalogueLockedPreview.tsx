import Link from "next/link";
import {businessPreview,personalCollectionPreview} from "@/lib/catalogue-access";
import "./catalogue-locked.css";
const photoSafe=(src:unknown):src is string=>typeof src==="string"&&(/^https:\/\/[^\s]+$/.test(src)||/^\/shop-for-yourself-images\/[a-zA-Z0-9._-]+$/.test(src));
function Lock(){return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/></svg>}
export default async function CatalogueLockedPreview({personal=false,category=false,remaining,compactOnly=false,fullPage=false}:{personal?:boolean;category?:boolean;remaining:number;compactOnly?:boolean;fullPage?:boolean}){
 if(remaining<=0)return null;
 const amount=Math.min(remaining,fullPage?24:personal?12:9);
 // Use only imagery from the already accessible free sample, not locked listing
 // photographs, IDs, prices or links. This is an illustrative preview.
 const samples=personal?[...await personalCollectionPreview("women"),...await personalCollectionPreview("men")]:await businessPreview();
 const photos=[...new Set(samples.map(p=>p.imageUrl).filter(photoSafe))];
 const offset=personal?0:Math.min(24,Math.max(0,photos.length-amount));
 return <section className={"hc-locked-preview"+(personal?" hc-locked-personal":"")+(compactOnly?" hc-locked-compact-only":"")+(compactOnly&&personal&&remaining>3?" hc-locked-tablet":"")} aria-label="Premium products">
 <div className="hc-locked-grid">{Array.from({length:amount},(_,i)=>{const photo=photos.length?photos[(offset+i)%photos.length]:undefined;return <Link href="/membership" prefetch={false} aria-label="Unlock more products with Premium" className="hc-locked-card" key={i}>
 <div className="hc-locked-photo" aria-hidden="true">{photo&&<img src={photo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>}<div className="hc-locked-glass"/></div>
 <div className="hc-locked-info"><span><Lock/> Premium</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></div>
 </Link>})}</div>
 <p className="hc-locked-caption">{category?"Unlock the rest of this category.":"Unlock the full catalogue."} <Link href="/membership">Explore Premium · £9.99/month</Link><small>Illustrative preview imagery.</small></p>
 </section>;
}
