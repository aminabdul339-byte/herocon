import Header from "@/components/Header";
import SourcingGuide from "@/components/SourcingGuide";
import type {Metadata} from "next";

export const metadata:Metadata={
 title:"How Sourcing Works — Your Interactive Herocon Guide",
 description:"Explore how Herocon product discovery, supplier links, cart and planned sourcing fulfilment work. Use an interactive four-stage guide and sourcing checklist."
};

export default function HowItWorks(){
 return <main className="hc-sourcing-guide">
  <Header/>
  <SourcingGuide/>
 </main>;
}
