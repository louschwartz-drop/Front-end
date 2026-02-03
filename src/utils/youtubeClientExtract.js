const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.moomoo.me",
];

const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function getVideoId(url) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

async function fetchWithCorsFallback(url) {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });
        if (res.ok) return res;
    } catch (_) {}
    const proxied = await fetch(CORS_PROXY + encodeURIComponent(url));
    if (!proxied.ok) throw new Error("Failed to fetch stream info");
    return proxied;
}

export async function extractYouTubeAudioClientSide(videoUrl, onProgress) {
    const videoId = getVideoId(videoUrl);
    if (!videoId) throw new Error("Invalid YouTube URL");

    for (const baseUrl of PIPED_INSTANCES) {
        try {
            const apiUrl = `${baseUrl}/streams/${videoId}`;
            const res = await fetchWithCorsFallback(apiUrl);
            const text = await res.text();
            const data = JSON.parse(text);

            if (!data?.audioStreams?.length) continue;

            const best = data.audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
            const audioUrl = best.url?.startsWith("http") ? best.url : new URL(best.url, baseUrl).href;

            onProgress?.("Fetching audio...");
            let audioRes;
            try {
                audioRes = await fetch(audioUrl, {
                    headers: { "Referer": baseUrl + "/" },
                });
            } catch (_) {
                audioRes = await fetch(CORS_PROXY + encodeURIComponent(audioUrl));
            }
            if (!audioRes.ok) throw new Error(`Download failed: ${audioRes.status}`);

            const blob = await audioRes.blob();
            const ext = best.format === "M4A" || best.mimeType?.includes("mp4") ? "m4a" : "webm";
            const mime = blob.type || (ext === "m4a" ? "audio/mp4" : "audio/webm");
            const file = new File([blob], `audio.${ext}`, { type: mime });
            return {
                file,
                title: data.title || "YouTube Video",
                thumbnail: data.thumbnailUrl || null,
            };
        } catch (e) {
            continue;
        }
    }
    throw new Error("Could not extract audio from any source");
}
