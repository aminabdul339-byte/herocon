import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "HEROCON — Source something remarkable", description: "Discover products and sellers from China through one beautifully simple sourcing experience." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-GB"><body>{children}</body></html>; }
