import Header from "@/components/Header";
import FulfilmentPreview from "@/components/FulfilmentPreview";
import "./warehouse.css";
export const metadata={title:"My Warehouse | Herocon",description:"Explore Herocon's two-stage purchasing and shipping journey."};
export default function WarehousePage(){return <main className="hw-page"><Header/><FulfilmentPreview/></main>;}
