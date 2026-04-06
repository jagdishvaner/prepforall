/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://prepforall.com",
  generateRobotsTxt: false, // We handle robots.ts separately
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/api/*"],
  additionalPaths: async () => {
    // Dynamic problem pages will be handled by app/sitemap.ts
    return [];
  },
};
