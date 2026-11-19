import Link from "next/link";
import Header from "@/components/Header";
import type {ReactNode} from "react";

type Props={eyebrow:string;title:string;lead:string;children:ReactNode};
export default function LegalPage({eyebrow,title,lead,children}:Props){
 return <main className="hc-legal-page">
  <Header/>
  <section className="hc-legal-hero"><div className="sc-container">
   <p className="sc-kicker">{eyebrow}</p>
   <h1>{title}</h1><p>{lead}</p>
   <span className="hc-legal-updated">Last updated: 19 November 2026</span>
  </div></section>
  <div className="sc-container hc-legal-layout">
   <article className="hc-legal-content">{children}</article>
   <aside className="hc-legal-aside">
    <strong>Policies & reporting</strong>
    <Link href="/privacy-policy">Privacy Policy</Link>
    <Link href="/terms-and-conditions">Terms and Conditions</Link>
    <Link href="/cookie-settings">Cookie Settings</Link>
    <Link href="/ip">IP Reporting</Link>
    <Link href="/dsa">DSA Reporting</Link>
    <Link href="/imprint">Imprint</Link>
    <Link href="/contact">Contact support</Link>
   </aside>
  </div>
 </main>;
}
export function LegalSection({title,children}:{title:string;children:ReactNode}){
 return <section className="hc-legal-section"><h2>{title}</h2>{children}</section>;
}
export function LegalContact({subject="Herocon legal enquiry",label="Contact the Herocon team"}:{subject?:string;label?:string}){
 return <a href={"mailto:aminabdul339@outlook.com?subject="+encodeURIComponent(subject)}>{label} <span aria-hidden="true">↗</span></a>;
}
