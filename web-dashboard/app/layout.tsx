import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ApexProvider } from "@/context/ApexContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { BackgroundEffects } from "@/components/ui/BackgroundEffects";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "APEX Trade AI | Institutional Market Intelligence",
  description: "Elite algorithmic trading and market structure analysis dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${poppins.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}>
        <ApexProvider>
          <BackgroundEffects />

          <div className="relative z-10 flex w-full h-screen overflow-hidden bg-transparent">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex">
               <Sidebar />
            </div>
            
            <main className="flex-1 flex flex-col min-w-0 h-full">
              {children}
            </main>
          </div>
        </ApexProvider>
      </body>
    </html>
  );
}
