import Header from "@/components/Header";
import ShippingEstimator from "@/components/ShippingEstimator";
import type {Metadata} from "next";

export const metadata:Metadata={title:"Estimate shipping costs",description:"Compare indicative shipping costs and delivery times by parcel weight, size and parcel type."};

export default function LandedCostPage(){
 return <main className="sc-guide-page hc-landed-cost-page">
  <Header/>
  <div className="hc-landed-cost-shell">
   <ShippingEstimator compact/>
   <p className="hc-landed-cost-note">Carrier estimates are subject to change, and checkout is not yet available. Verify any taxes and duties against official <a href="https://www.gov.uk/trade-tariff" target="_blank" rel="noopener noreferrer">UK Trade Tariff</a> guidance and your freight provider.</p>
  </div>
 </main>;
}
