import Header from "@/components/Header";
import Link from "next/link";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {freightReviewRows} from "@/lib/freight-review";
import type {FreightClass} from "@/lib/freight-classification";
export const dynamic="force-dynamic";
export default async function FreightReviewPage({searchParams}:{searchParams:Promise<{group?:string;page?:string}>}){
 if(!isOwnerPremiumCustomer(await currentCustomer()))return <main><Header/><section className="sc-container"><h1>Domestic freight review</h1><p>Owner sign-in required.</p><Link href="/account?next=%2Fowner%2Fhiobuy%2Ffreight-review">Sign in</Link></section></main>;
 const rows=await freightReviewRows(),query=await searchParams;
 const group:FreightClass=query.group==="light"?"light":query.group==="bulky"?"bulky":"review";
 const counts={light:rows.filter(r=>r.classification==="light").length,bulky:rows.filter(r=>r.classification==="bulky").length,review:rows.filter(r=>r.classification==="review").length};
 const filtered=rows.filter(r=>r.classification===group),size=50,pages=Math.max(1,Math.ceil(filtered.length/size)),page=Math.min(pages,Math.max(1,Number.parseInt(query.page||"1",10)||1));
 const href=(g:string,p=1)=>"/owner/hiobuy/freight-review?group="+g+"&page="+p;
 return <main><Header/><section className="sc-container" style={{padding:"40px 20px 80px"}}><Link href="/owner/hiobuy">Back to fulfilment setup</Link><h1>Unconfirmed domestic freight review</h1><p>{rows.length} distinct catalogue sources with missing saved freight. No supplier calls. Classification uses listing titles and categories, not confirmed package weights or supplier quotes.</p><p>Lightweight allowance: £0.99 estimated in cart per distinct listing. Bulky and uncertain items remain unconfirmed. No supplier records or payable checkout amounts are changed.</p><div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"20px 0"}}>{(["bulky","review","light"] as const).map(g=><Link key={g} className={"sc-button"+(g===group?" sc-button-dark":"")} href={href(g)}>{g==="light"?"£0.99 candidates":g==="bulky"?"Bulky items":"Needs review"} ({counts[g]})</Link>)}</div><p>Page {page} of {pages} · {filtered.length} products</p><div style={{display:"grid",gap:8}}>{filtered.slice((page-1)*size,page*size).map(r=><article key={r.url} style={{display:"flex",alignItems:"center",gap:14,border:"1px solid #ddd",borderRadius:12,padding:12}}>{r.image&&<img src={r.image} alt="" width={64} height={64} loading="lazy" style={{objectFit:"cover",borderRadius:8}}/>}<div style={{flex:1}}><Link href={r.path}><strong>{r.title}</strong></Link><p style={{margin:"4px 0"}}>{r.category} · {r.classification==="light"?"£0.99 estimate":"Freight unconfirmed"}</p><a href={r.url} target="_blank" rel="noopener noreferrer">Original marketplace</a></div></article>)}</div><div style={{display:"flex",gap:12,marginTop:20}}>{page>1&&<Link className="sc-button" href={href(group,page-1)}>Previous</Link>}{page<pages&&<Link className="sc-button" href={href(group,page+1)}>Next</Link>}</div></section></main>;
}
