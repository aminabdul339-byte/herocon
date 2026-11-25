import Header from "@/components/Header";import ShoppingCenterNav from "@/components/ShoppingCenterNav";import FulfilmentPreview from "@/components/FulfilmentPreview";import "./warehouse.css";
export const metadata={title:"Warehouse | Herocon",description:"Manage your stored items and arrange shipping."};
export default function WarehousePage(){return <main className="hw-page"><Header/><ShoppingCenterNav/><FulfilmentPreview view="warehouse"/></main>;}
