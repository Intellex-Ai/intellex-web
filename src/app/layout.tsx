import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { RecoveryRedirect } from "@/components/auth/RecoveryRedirect";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intellex - AI-Powered Intelligence",
  description: "The next generation of intelligence gathering. Analyze, process, and deploy data with cinematic precision.",
  openGraph: {
    title: "Intellex - AI-Powered Intelligence",
    description: "The next generation of intelligence gathering.",
    url: "https://intellex.ai",
    siteName: "Intellex",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellex - AI-Powered Intelligence",
    description: "The next generation of intelligence gathering.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
        <RecoveryRedirect />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
