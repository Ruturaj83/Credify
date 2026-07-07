import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CCIMS — Credit Card Intelligence",
  description: "Premium credit card management, reward tracking, and smart recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[hsl(0,0%,4%)] text-white min-h-screen`}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-800/20 rounded-full blur-[120px] animate-blob" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-800/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        </div>
        {children}
      </body>
    </html>
  );
}
