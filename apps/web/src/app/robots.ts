import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://awardrobe.co/sitemap.xml",
    host: "https://awardrobe.co",
  };
}
