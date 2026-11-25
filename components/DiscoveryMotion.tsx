import Link from "next/link";
type Card={id:string;title:string;marketplace:string;image:string;price:string;position:number};
export default function DiscoveryMotion({cards}:{cards:Card[]}){
 return <div className="hd-scene">
  <div className="hd-orbit" aria-hidden="true"/><div className="hd-scene-top"><span className="hd-scene-brand">hero<span>con.</span></span><span className="hd-scene-label"><i aria-hidden="true"/> From the catalogue</span></div>
  {cards.map(card=><Link key={card.id} prefetch={false} href={"/product/"+encodeURIComponent(card.id)} className={"hd-float hd-float-"+card.position} aria-label={"Explore "+card.title+" on Herocon"}>
    <div className="hd-card-photo"><img src={card.image} alt={card.title} width={360} height={280} loading={card.position<3?"eager":"lazy"} decoding="async" referrerPolicy="no-referrer"/></div>
    <div className="hd-card-meta"><span>{card.title}</span><div className="hd-card-price"><b>{card.price}</b><small>{card.marketplace} · reference price</small></div></div>
  </Link>)}
  <Link href="/search" className="hd-source-pill"><i aria-hidden="true"/>Explore the catalogue <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></Link>
 </div>;
}
