import Header from "@/components/Header";import ShoppingCenterNav from "@/components/ShoppingCenterNav";import ShoppingCenterPage from "@/components/ShoppingCenterPage";import "../owner/owner-order.css";
export const metadata={title:"Warehouse | Herocon"};
export default function Page(){return <main className="hc-center-page"><Header/><ShoppingCenterNav/><ShoppingCenterPage section="warehouse"/></main>;}
