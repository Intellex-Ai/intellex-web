import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { RecoveryRedirect } from "@/components/auth/RecoveryRedirect";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { metadataBaseUrl } from "@/lib/site-url";

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

export const viewport: Viewport = {
  themeColor: "#ff4d00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Intellex - AI-Powered Intelligence",
  description: "The next generation of intelligence gathering. Analyze, process, and deploy data with cinematic precision.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Intellex",
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: metadataBaseUrl,
  openGraph: {
    title: "Intellex - AI-Powered Intelligence",
    description: "The next generation of intelligence gathering.",
    url: "/",
    siteName: "Intellex",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Intellex - AI-Powered Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellex - AI-Powered Intelligence",
    description: "The next generation of intelligence gathering.",
    images: ["/api/og"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <PWAProvider>
          <RecoveryRedirect />
          {children}
          <Analytics />
          <SpeedInsights />
        </PWAProvider>
      </body>
    </html>
  );
}
