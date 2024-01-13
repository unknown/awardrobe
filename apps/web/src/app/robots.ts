import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.awardrobe.co/sitemap.xml",
    host: "https://www.awardrobe.co",
  };
}
