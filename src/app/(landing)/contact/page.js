import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact DropPR.ai - Sales & Support Hub",
  description: "Get in touch with the DropPR.ai sales team. Build credibility for your brand with trusted solutions and customized article distribution support.",
  keywords: "Contact DropPR.ai, PR sales, content publishing support, article generation packages, PR distribution support",
  openGraph: {
    title: "Contact DropPR.ai - Sales & Support Hub",
    description: "Get in touch with the DropPR.ai sales team. Build credibility for your brand with trusted solutions and customized article distribution support.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact DropPR.ai - Sales & Support Hub",
    description: "Get in touch with the DropPR.ai sales team. Build credibility for your brand with trusted solutions and customized article distribution support.",
    images: ["/logo.png"],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
