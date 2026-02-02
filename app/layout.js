import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "UI/UX Mentor",
  description: "AI-powered UI/UX analysis tool",
};

import { Header } from "@/components/Header";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header />
        <main className="container" style={{ minHeight: '80vh', padding: '2rem 0' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
