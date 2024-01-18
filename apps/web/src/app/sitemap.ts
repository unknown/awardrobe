import { findListedProducts } from "@awardrobe/db";

export const dynamic = "force-dynamic";
export const revalidate = 43200; // 12 hours

export default async function sitemap() {
  const routes = ["", "/home", "/login"].map((route) => ({
    url: `https://www.awardrobe.co${route}`,
    lastModified: new Date(),
  }));

  const listedProducts = await findListedProducts();

  const products = listedProducts.map((product) => ({
    url: `https://www.awardrobe.co/product/${product.publicId}`,
    lastModified: new Date(), // TODO: make this the last time the product was updated
  }));

  return [...routes, ...products];
}
