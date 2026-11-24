import Link from "next/link";
type Card={id:string;title:string;marketplace:string;image:string;price:string;position:number};
export default function DiscoveryMotion({cards}:{cards:Card[]}){
 return <div className="hd-scene">
  <div className="hd-orbit" aria-hidden="true"/>
  {cards.map(card=><Link key={card.id} prefetch={false} href={"/product/"+encodeURIComponent(card.id)} className={"hd-float hd-float-"+card.position} aria-label={"Explore "+card.title+" on Herocon"}>
    <div className="hd-card-photo"><img src={card.image} alt={card.title} width={360} height={280} loading={card.position<3?"eager":"lazy"} decoding="async" referrerPolicy="no-referrer"/></div>
    <div className="hd-card-meta"><span>{card.title}</span><div className="hd-card-price"><b>{card.price}</b><small>{card.marketplace} · reference price</small></div></div>
  </Link>)}
  <Link href="/search" className="hd-source-pill"><i aria-hidden="true"/>Discover the original source</Link>
 </div>;
}
