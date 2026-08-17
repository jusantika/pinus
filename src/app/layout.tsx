import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import PinLockModal from "@/components/layout/PinLockModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PinUs",
  description: "Track your memories and places with your loved one.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-black">
        {/* Membungkus seluruh aplikasi dengan PinLockModal */}
        <PinLockModal>
          <div className="flex-1 flex flex-col pb-16">
            {children}
          </div>
          <Navbar />
        </PinLockModal>
      </body>
    </html>
  );
}
