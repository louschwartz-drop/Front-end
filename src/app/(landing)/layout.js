import Header from "../../components/landingPage/Header";
import Footer from "../../components/landingPage/Footer";

export const metadata = {
  title: "DropPR.ai - AI-Powered Media & PR Distribution Platform",
  description: "Build instant exposure with DropPR.ai. Convert your videos into AI-written articles and distribute them to top media outlets.",
  keywords: "AI article generation, press release distribution, media outlets, PR distribution, video to article, content publishing",
  openGraph: {
    title: "DropPR.ai - AI-Powered Media & PR Distribution Platform",
    description: "Build instant exposure with Drop PR. Convert your videos into AI-written articles and distribute them to top media outlets.",
    type: "website",
  },
  icons: {
    icon: "/drop-logo.png",
    apple: "/drop-logo.png",
    shortcut: "/drop-logo.png",
  },
};

export default function LandingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="grow pt-16 md:pt-20">{children}</main>
      <Footer />
    </div>
  );
}
