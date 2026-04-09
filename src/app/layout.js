import { Geist, Geist_Mono } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";

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

export const metadata = {
  metadataBase: new URL("https://www.droppr.ai"),
  title: "DropPR.ai - AI-Powered Media & PR Distribution Platform",
  description:
    "Build instant exposure with DropPR.ai. Convert your videos into AI-written articles and distribute them to top media outlets.",
  keywords: "AI article generation, press release distribution, media outlets, PR distribution, video to article, content publishing",
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
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
        </GoogleOAuthProvider>
      </body>
    </html >
  );
}

