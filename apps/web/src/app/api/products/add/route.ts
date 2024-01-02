import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { downloadImage, getAdapterFromUrl } from "@awardrobe/adapters";
import { createProduct, createProductVariants, findStore, Product, Public } from "@awardrobe/db";
import { addProductImage } from "@awardrobe/media-store";
import { addProduct } from "@awardrobe/meilisearch-types";

import { auth } from "@/utils/auth";

type AddProductRequest = {
  productUrl: string;
};

type AddProductSuccess = {
  status: "success";
  product: Public<Product>;
};

type AddProductError = {
  status: "error";
  error: string;
};

export type AddProductResponse = AddProductSuccess | AddProductError;

export async function POST(req: Request) {
  const session = await auth();

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

    const [store, productCode] = await Promise.all([
      findStore({ storeHandle: adapter.storeHandle }),
      adapter.getProductCode(productUrl),
    ]);

    if (!store) {
      return NextResponse.json<AddProductResponse>(
        { status: "error", error: "Store not yet supported" },
        { status: 400 },
      );
    }

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
      storeId: store.id,
    });

    const createVariantsPromise = createProductVariants({
      productId: product.id,
      variantInfos: details.variants,
    });

    const addProductToSearchPromise = addProduct({
      id: product.publicId,
      name: details.name,
      storeName: store.name,
    });

    const addImagePromise = details.imageUrl
      ? downloadImage(details.imageUrl).then((imageBuffer) =>
          addProductImage(product.publicId, imageBuffer),
        )
      : undefined;

    await Promise.all([createVariantsPromise, addProductToSearchPromise, addImagePromise]);

    revalidatePath("/(app)/(browse)/search", "page");

    const { id: _, ...publicProduct } = product;

    return NextResponse.json<AddProductResponse>({
      status: "success",
      product: publicProduct,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json<AddProductResponse>(
      { status: "error", error: "Internal server error" },
      { status: 500 },
    );
  }
}
