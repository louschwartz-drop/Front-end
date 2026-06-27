import { Geist, Geist_Mono, Lora } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Script from "next/script";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata = {
  metadataBase: new URL("https://www.droppr.ai"),
  title: "DropPR.ai - AI-Powered Media & PR Distribution Platform",
  description:
    "Build instant exposure with DropPR.ai. Convert your videos into AI-written articles and distribute them to top media outlets.",
  keywords: "AI article generation, press release distribution, media outlets, PR distribution, video to article, content publishing",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DropPR.ai",
  },
  icons: {
    icon: "/drop-logo.png",
    apple: "/drop-logo.png",
    shortcut: "/drop-logo.png",
  },
  openGraph: {
    title: "DropPR.ai - AI-Powered Media & PR Distribution Platform",
    description: "Build instant exposure with DropPR.ai. Convert your videos into AI-written articles and distribute them to top media outlets.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DropPR.ai - AI-Powered Media & PR Distribution Platform",
    description: "Build instant exposure with DropPR.ai. Convert your videos into AI-written articles and distribute them to top media outlets.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { SocketProvider } from "@/context/SocketContext";
import ChatWidgetWrapper from "@/components/chat/ChatWidgetWrapper";
import NextAuthProvider from "@/context/NextAuthProvider";
import PWAInstallPrompt from "@/components/pwa/InstallPrompt";
import NetworkStatusIndicator from "@/components/pwa/NetworkStatusIndicator";
import ServiceWorkerUpdater from "@/components/pwa/ServiceWorkerUpdater";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "DropPR.ai",
              "url": "https://www.droppr.ai",
              "logo": "https://www.droppr.ai/logo.png",
              "sameAs": [
                "https://twitter.com/droppr_ai",
                "https://www.linkedin.com/company/droppr-ai"
              ]
            })
          }}
        />
        <NextAuthProvider>
          <SocketProvider>
            {children}
            <ChatWidgetWrapper />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
            <PWAInstallPrompt />
            <NetworkStatusIndicator />
            <ServiceWorkerUpdater />
          </SocketProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}

