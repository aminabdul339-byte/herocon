import "./globals.css";
import "./herocon-redesign.css";
import "./premium-home.css";
import "./contact-guide.css";
import "./legal.css";
import "./shop-journey.css";
import "./account.css";
import "./experience.css";
import "./sourcing-guide.css";
import "./minimal-home.css";
import "./atelier-home.css";
import "./brand-system-2026.css";
import "./brand-refinement-2026.css";
import "./product-refinement.css";
import "./herocon-flow.css";
import type {Metadata} from "next";
import {CartProvider} from "@/components/CartProvider";
import Footer from "@/components/Footer";
export const metadata:Metadata={
  title:{default:"Herocon — Your link to China",template:"%s | Herocon"},
  description:"Discover wholesale products from Chinese marketplaces, learn how sourcing works and plan your first import with Herocon.",
  metadataBase:new URL("https://herocon.store")
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><CartProvider><div className="hc-site">{children}<Footer/></div></CartProvider></body></html>;
}