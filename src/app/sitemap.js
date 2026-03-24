export default function sitemap() {
  const baseUrl = 'https://www.droppr.ai';
  
  // Landing pages
  const routes = [
    '',
    '/pricing',
    '/faq',
    '/contact',
    '/privacy',
    '/terms'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
