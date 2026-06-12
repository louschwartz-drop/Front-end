export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/user/", "/admin/", "/auth/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended"
        ],
        allow: "/",
        disallow: ["/api/", "/user/", "/admin/", "/auth/"],
      }
    ],
    sitemap: "https://www.droppr.ai/sitemap.xml",
  };
}
