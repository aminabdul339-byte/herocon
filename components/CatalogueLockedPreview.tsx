import Link from "next/link";
import {ArrowIcon} from "@/components/ArrowIcon";
import "./catalogue-locked.css";
export default function CatalogueLockedPreview({personal=false,category=false,remaining,compactOnly=false}:{personal?:boolean;category?:boolean;remaining:number;compactOnly?:boolean}){
 if(remaining<=0)return null;
 return <section className={"hc-locked-preview"+(personal?" hc-locked-personal":"")+(compactOnly?" hc-locked-compact-only":"")+(compactOnly&&personal&&remaining>2?" hc-locked-tablet":"")} aria-label="Premium products">
 <div className="hc-locked-grid" aria-hidden="true">{Array.from({length:Math.min(remaining,personal?8:6)},(_,i)=><div className="hc-locked-card" key={i}><div className={"hc-locked-photo hc-locked-tone-"+i}><span/></div><div className="hc-locked-line"/><div className="hc-locked-price"/></div>)}</div>
 <div className="hc-locked-overlay"><div className="hc-locked-message"><span className="hc-locked-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/></svg></span><strong>Unlock {category?"this category":"the full catalogue"}</strong><p>{category?"Browse every product in this category.":remaining.toLocaleString("en-GB")+" more products with Premium."}</p><Link href="/membership">Explore Premium <ArrowIcon direction="right"/></Link><small>£9.99 / month</small></div></div>
 </section>;
}
