export default function sitemap() {
  const baseUrl = 'https://www.droppr.ai';
  
  // Landing pages
  const routes = [
    '',
    '/pricing',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/blog',
    '/press-releases'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'weekly' : route === '/blog' || route === '/press-releases' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : route === '/blog' || route === '/press-releases' ? 0.9 : 0.8,
  }));

  return routes;
}
