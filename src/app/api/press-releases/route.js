import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '30';
    const keywords = searchParams.get('keywords') || 'press release AI';
    const country = searchParams.get('country') || 'us';
    const category = searchParams.get('category') || 'technology';
    const language = searchParams.get('language') || 'en';
    const type = searchParams.get('type') || '1';
    
    // Hardcoded as requested
    const API_KEY = "dXND77Am6Zv7gvZe37eGWWZEmDJwHIXNzAefrIvpqlg7vxqw";

    let url = `https://api.currentsapi.services/v1/search?apiKey=${API_KEY}&keywords=${encodeURIComponent(keywords)}&language=${language}&page_number=${page}&page_size=${pageSize}`;

    if (country && country !== 'all') {
        url += `&country=${country}`;
    }
    if (category && category !== 'all') {
        url += `&category=${category}`;
    }
    if (type && type !== 'all') {
        url += `&type=${type}`;
    }

    try {
        const res = await fetch(url, { 
            next: { revalidate: 3600 },
            headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return NextResponse.json(errorData, { status: res.status });
        }
        
        const data = await res.json();
        return NextResponse.json({
            articles: data.news || [],
            page: data.page,
            status: data.status
        });
    } catch (error) {
        console.error("API Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
    }
}
