import Link from "next/link";
import {ArrowIcon} from "@/components/ArrowIcon";
import {productPrice,productId} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
import DiscoveryMotion from "@/components/DiscoveryMotion";

const edit=[
 {id:"Bxt1jifoJ5oinfAzFTydtw",title:"Sculptural cat décor",marketplace:"Taobao"},
 {id:"HEWCWVJ5M7RL3Y-J_uV0bg",title:"Body-wave wig",marketplace:"1688"},
 {id:"qLiCZEEhOnut6fHdkH-Bow",title:"Moissanite ring",marketplace:"Taobao"},
 {id:"g8ulL_pzvvdAvGHNTXB-xw",title:"Gold-accent glassware",marketplace:"Taobao"}
] as const;

export default function AtelierHero({products}:{products:Product[]}){
 const cards=edit.flatMap((entry,index)=>{
  const p=products.find(p=>productId(p)===entry.id&&p.imageUrl&&p.originalMarketplaceUrl);
  if(!p||!p.imageUrl)return [];
  return [{id:entry.id,title:entry.title,marketplace:entry.marketplace,image:p.imageUrl,price:productPrice(p),position:index+1}];
 });
 return <section className="hd-studio" aria-labelledby="hd-studio-title">
  <div className="hd-studio-copy">
   <p className="hd-studio-eyebrow"><span aria-hidden="true"/>Discover · Source · Shop</p>
   <h1 id="hd-studio-title">A world of finds.<br/><em>One place to discover.</em></h1>
   <p className="hd-studio-description">Explore products from China’s marketplaces, find inspiration for your next business or discover something for yourself. All in one community-powered catalogue.</p>
   <div className="hd-studio-actions">
    <Link href="/search" className="hd-studio-action hd-studio-primary">Source for your business <ArrowIcon direction="right"/></Link>
    <Link href="/shop-for-yourself" className="hd-studio-action hd-studio-secondary">Shop for yourself <ArrowIcon direction="right"/></Link>
   </div>
   <div className="hd-studio-marketplaces" aria-label="Supported marketplaces"><b>1688</b><i/><b>Taobao</b><i/><b>Weidian</b><i/><b>Tmall</b></div>
  </div>
  <DiscoveryMotion cards={cards}/>
 </section>;
}
