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
  themeColor: "#3b82f6",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "DropPR.ai - AI-Powered Media & PR Distribution Platform",
    description: "Build instant exposure with DropPR.ai. Convert your videos into AI-written articles and distribute them to top media outlets.",
  },
};

import { SocketProvider } from "@/context/SocketContext";
import ChatWidgetWrapper from "@/components/chat/ChatWidgetWrapper";
import NextAuthProvider from "@/context/NextAuthProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
        suppressHydrationWarning
      >
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
          </SocketProvider>
        </NextAuthProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

