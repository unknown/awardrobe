import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getAdapterFromUrl } from "@awardrobe/adapters";
import { createProduct } from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";
import { Prisma, Product } from "@awardrobe/prisma-types";

import { authOptions } from "@/utils/auth";

type AddProductRequest = {
  productUrl: string;
};

type AddProductSuccess = {
  status: "success";
  product: Product;
};

type AddProductError = {
  status: "error";
  error: string;
};

export type AddProductResponse = AddProductSuccess | AddProductError;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json<AddProductResponse>(
      { status: "error", error: "Unauthenticated" },
      { status: 401 },
    );
  }

  try {
    const { productUrl }: AddProductRequest = await req.json();

    const adapter = getAdapterFromUrl(productUrl);
    if (!adapter) {
      return NextResponse.json<AddProductResponse>(
        { status: "error", error: "Store not yet supported" },
        { status: 400 },
      );
    }

    const productCode = await adapter.getProductCode(productUrl);
    if (!productCode) {
      return NextResponse.json<AddProductResponse>(
        { status: "error", error: "Error retrieving product code" },
        { status: 400 },
      );
    }

    const details = await adapter.getProductDetails(productCode).catch((error) => {
      console.error(error);
      return null;
    });
    if (!details) {
      return NextResponse.json<AddProductResponse>(
        { status: "error", error: "Error retrieving product details" },
        { status: 400 },
      );
    }

    const product = await createProduct({
      productCode,
      name: details.name,
      variants: details.variants,
      storeHandle: adapter.storeHandle,
    });

    const addPromise = addProduct({
      name: details.name,
      id: product.id,
      storeName: product.store.name,
    });
    const addImagePromise = addProductImage(product.id, details);
    await Promise.all([addPromise, addImagePromise]);

    revalidatePath("/(app)/(browse)/browse", "page");

    return NextResponse.json<AddProductResponse>({
      status: "success",
      product,
    });
  } catch (e) {
    console.error(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json<AddProductResponse>(
          {
            status: "error",
            error: "Product already exists",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json<AddProductResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
