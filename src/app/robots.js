export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/user/", "/admin/", "/auth/"],
    },
    sitemap: "https://www.droppr.ai/sitemap.xml",
  };
}
