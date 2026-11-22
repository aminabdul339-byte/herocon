import type {Metadata} from "next";
import Link from "next/link";
import Header from "@/components/Header";
import ConsolidationPlanner from "@/components/ConsolidationPlanner";

export const metadata:Metadata={title:"Parcel consolidation planner",description:"Plan a combined parcel weight without creating a paid warehouse order."};
export default function ConsolidationPage(){
 return <main className="hc-wh-page"><Header/>
  <section className="hc-wh-hero hc-wh-hero-compact"><div className="hc-wh-container">
   <p className="sc-kicker"><Link href="/warehouse">WAREHOUSE CENTRE</Link> / PARCEL PLANNING</p>
   <h1>Plan together.<br/><em>Ship with clarity.</em></h1>
   <p>Estimate your combined parcel weight without placing an order, paying for storage or requesting a warehouse consolidation.</p>
  </div></section>
  <div className="hc-wh-container"><ConsolidationPlanner/></div>
 </main>;
}
