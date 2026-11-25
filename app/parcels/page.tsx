import Header from "@/components/Header";import ShoppingCenterNav from "@/components/ShoppingCenterNav";import FulfilmentPreview from "@/components/FulfilmentPreview";import "../warehouse/warehouse.css";
export const metadata={title:"Parcels | Herocon",description:"Track your paid international shipments."};
export default function ParcelsPage(){return <main className="hw-page"><Header/><ShoppingCenterNav/><FulfilmentPreview view="shipping"/></main>;}
