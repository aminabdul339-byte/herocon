import Link from "next/link";

const EDIT_PHOTO = "https://images.pexels.com/photos/7679685/pexels-photo-7679685.jpeg?auto=compress&cs=tinysrgb&w=1000&q=85";

function ArrowUpRight() {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19 19 5M8 5h11v11"/></svg>;
}

function BagDrawing({small = false}: {small?: boolean}) {
  return <svg className={small ? "ha-drawing ha-drawing-small" : "ha-drawing"} viewBox="0 0 180 180" fill="none" aria-hidden="true">
    <ellipse cx="92" cy="157" rx="62" ry="7" fill="#968A7A" opacity=".13"/>
    <path d="M42 64h96l14 81c-39 15-88 15-124 0l14-81Z" fill="#9A7A62"/>
    <path d="M58 66V51c0-24 11-37 32-37 21 0 32 13 32 37v15" stroke="#775B48" strokeWidth="15" strokeLinecap="round"/>
    <path d="M58 66V51c0-24 11-37 32-37 21 0 32 13 32 37v15" stroke="#C5A58D" strokeWidth="10" strokeLinecap="round"/>
    <path d="M40 91c29 20 67 28 100 3" stroke="#D4B9A0" strokeWidth="2" opacity=".75"/>
    <path d="M85 89h11v18H85z" fill="#E0C18D"/><path d="M85 89h11" stroke="#F3DEAC" strokeWidth="2"/>
  </svg>;
}

function BottleDrawing() {
  return <svg className="ha-drawing" viewBox="0 0 180 180" fill="none" aria-hidden="true">
    <ellipse cx="90" cy="160" rx="42" ry="7" fill="#71816C" opacity=".14"/>
    <rect x="65" y="28" width="50" height="15" rx="5" fill="#758B75"/>
    <path d="M61 42h58v18c0 10 15 18 15 33v41c0 17-16 27-44 27-28 0-44-10-44-27V93c0-15 15-23 15-33V42Z" fill="#AEBFA7" stroke="#738971" strokeWidth="2"/>
    <path d="M74 47h31v18c0 11 13 20 13 35v30c0 11-10 18-28 18" stroke="#D6E0CE" strokeWidth="5" strokeLinecap="round" opacity=".75"/>
    <rect x="61" y="96" width="58" height="41" rx="4" fill="#E5E8D9" opacity=".85"/>
    <path d="M72 109h36m-30 8h24" stroke="#A4B4A0" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}

function MarketplaceArtwork() {
  return <div className="ha-art" aria-hidden="true">
    <div className="ha-artboard">
      <div className="ha-orbit"/>
      <div className="ha-art-corner">GLOBAL DISCOVERY / 003</div>
      <div className="ha-art-pill">CHINA MARKETPLACES <span>·</span> CURATED BY HEROCON</div>
      <div className="ha-visual-card ha-market-card">
        <div className="ha-card-kicker">01 / BROWSE THE SOURCE</div>
        <div className="ha-market-title">Original<br/><em>marketplaces.</em></div>
        <div className="ha-market-rows"><div><b>1688</b><ArrowUpRight/></div><div><b>Taobao</b><ArrowUpRight/></div><div><b>Weidian</b><ArrowUpRight/></div></div>
      </div>
      <div className="ha-visual-card ha-edit-card">
        <div className="ha-card-kicker">02 / EXPLORE THE EDIT</div>
        <div className="ha-edit-brand">hero<span>con.</span></div>
        <div className="ha-edit-photo"><img src={EDIT_PHOTO} alt="" width="600" height="350" loading="eager"/></div>
        <div className="ha-edit-title">Find your<br/><em>something.</em></div>
        <div className="ha-edit-products">
          <div className="ha-edit-product ha-edit-product-bag"><BagDrawing small/><span>Accessories</span></div>
          <div className="ha-edit-product ha-edit-product-bottle"><BottleDrawing/><span>Lifestyle</span></div>
        </div>
      </div>
      <div className="ha-visual-card ha-detail-card">
        <div className="ha-card-kicker">03 / SEE THE SOURCE</div>
        <div className="ha-detail-product"><BagDrawing/></div>
        <div className="ha-detail-name">Classic shoulder bag</div>
        <div className="ha-detail-description">Original marketplace link</div>
        <div className="ha-detail-button">View source on 1688 <ArrowUpRight/></div>
      </div>
      <svg className="ha-connector" viewBox="0 0 620 780" fill="none" focusable="false"><path d="M0 599C116 518 164 640 287 578S515 504 620 469" stroke="#A1B69A" strokeWidth="2.3" strokeDasharray="2 8" strokeLinecap="round"/></svg>
    </div>
    <div className="ha-art-signoff">The source behind the find.</div>
  </div>;
}

export default function AtelierHero() {
  return <section className="ha-hero" aria-labelledby="ha-hero-title">
    <div className="ha-copy">
      <div className="ha-eyebrow">HEROCON / THE DISCOVERY ATELIER</div>
      <h1 id="ha-hero-title"><span>Find more</span><span>than you <em>came for.</em></span></h1>
      <p>An inspired destination for personal discoveries and sourcing ideas — with links to original marketplace listings.</p>
      <div className="ha-actions">
        <Link href="/search" className="ha-action ha-action-primary"><span><strong>01 / Source for your business</strong><small>Explore sourcing</small></span><ArrowUpRight/></Link>
        <Link href="/shop-for-yourself" className="ha-action ha-action-secondary"><span><strong>02 / Shop for yourself</strong><small>The curated edit</small></span><ArrowUpRight/></Link>
      </div>
    </div>
    <MarketplaceArtwork/>
  </section>;
}
