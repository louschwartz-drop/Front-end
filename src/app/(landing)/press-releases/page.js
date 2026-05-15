import Header from "@/components/landingPage/Header";
import Footer from "@/components/landingPage/Footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PressRoomClient from "./PressRoomClient";

async function getPressReleases() {
    // Hardcoded API Key for Press Room
    const API_KEY = "dXND77Am6Zv7gvZe37eGWWZEmDJwHIXNzAefrIvpqlg7vxqw"; 
    
    const url = `https://api.currentsapi.services/v1/search?apiKey=${API_KEY}&keywords=press%20release%20AI&language=en`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 3600 },
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("Currents API Error:", res.status, errorData);
            return [];
        }
        const data = await res.json();
        return data.news || [];
    } catch (error) {
        console.error("Press Release Fetch Error:", error);
        return [];
    }
}

async function getPlatformArticles() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
        const res = await fetch(`${baseUrl}/public/press-releases?limit=12`, {
            next: { revalidate: 300 } // Cache for 5 mins
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error("Platform Fetch Error:", error);
        return [];
    }
}

export const metadata = {
    title: "Press Room | DropPR.ai - Latest AI News & Industry Updates",
    description: "Stay updated with the latest press releases, AI advancements, and media distribution news from DropPR.ai and the global tech industry.",
};

export default async function PressReleasesPage() {
    const [newsArticles, platformArticles] = await Promise.all([
        getPressReleases(),
        getPlatformArticles()
    ]);

    return (
        <>
            {/* Articles Grid (Client Component) with integrated Hero/Filters & CTA */}
            <PressRoomClient 
                initialNews={newsArticles} 
                initialPlatform={platformArticles} 
            />
        </>
    );
}
