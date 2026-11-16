import Header from "@/components/Header";
import SourcingBrief from "@/components/SourcingBrief";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Prepare a sourcing brief",description:"Create a detailed sourcing enquiry you can share with a Chinese supplier or purchasing agent."};
export default async function SourcingPage({searchParams}:{searchParams:Promise<{product?:string}>}){
 const params=await searchParams;
 const product=typeof params.product==="string"?params.product.slice(0,500):"";
 return <main className="sc-guide-page"><Header/><section className="sc-page-hero sc-container"><p className="sc-kicker">THE SOURCING BRIEF BUILDER</p><h1>Know what you need.<br/><em>Ask for the right quote.</em></h1><p>Build a clear product request to share with a supplier or purchasing agent. It&apos;s free to prepare and download; no order is placed or enquiry sent automatically.</p></section><section className="sc-section sc-container sc-brief-section"><SourcingBrief initialProduct={product}/></section></main>;
}