import { findListedProducts } from "@awardrobe/db";

export default async function sitemap() {
  const routes = ["", "/home", "/login"].map((route) => ({
    url: `https://awardrobe.co${route}`,
    lastModified: new Date(),
  }));

  const products = (await findListedProducts()).map((product) => ({
    url: `https://awardrobe.co/product/${product.publicId}`,
    lastModified: new Date(), // TODO: make this the last time the product was updated
  }));

  return [...routes, ...products];
}
