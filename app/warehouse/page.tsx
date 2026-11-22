import type {Metadata} from "next";
import Header from "@/components/Header";
import WarehouseHub from "@/components/WarehouseHub";

export const metadata:Metadata={title:"Warehouse and parcels",description:"Manage your Herocon quote requests and access parcel planning, tracking and shipping estimates."};
export default function WarehousePage(){
 return <main className="hc-wh-page"><Header/>
  <section className="hc-wh-hero"><div className="hc-wh-container">
   <p className="sc-kicker">HEROCON / WAREHOUSE CENTRE</p>
   <h1>Your sourcing journey,<br/><em>in one place.</em></h1>
   <p>Explore your private request history, check real order updates and plan international shipping. No paid warehouse subscription is needed for these tools.</p>
  </div></section>
  <div className="hc-wh-container"><WarehouseHub/></div>
 </main>;
}
