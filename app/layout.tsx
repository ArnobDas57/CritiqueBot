import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/ui/Footer/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // this sets a CSS variable
});

export const metadata: Metadata = {
  title: "CritiqueBot",
  description:
    "Upload your resume and get AI-powered feedback tailored to your needs!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col bg-cyan-300 font-sans`}
      >
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
