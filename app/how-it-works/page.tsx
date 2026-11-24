import Header from "@/components/Header";
import SourcingGuide from "@/components/SourcingGuide";
import type {Metadata} from "next";

export const metadata:Metadata={
 title:"How Sourcing Works — Discover, Compare and Source",
 description:"See how Herocon brings Chinese marketplace products together, helps you compare supplier details and save a shortlist, and understand the planned purchasing and delivery journey."
};

export default function HowItWorks(){
 return <main className="hc-sourcing-guide">
  <Header/>
  <SourcingGuide/>
 </main>;
}
