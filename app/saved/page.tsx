import Header from "@/components/Header";
import SourcingWorkspace from "@/components/SourcingWorkspace";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Saved products and sourcing workspace",description:"Organise your supplier finds, compare products and estimate margins."};
export default function SavedPage(){return <main className="sc-guide-page"><Header/><SourcingWorkspace/></main>;}
