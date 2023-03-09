import { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getProductData } from "../services/uniqlo";

interface RequestBody {
  productUrl?: string;
  productId?: string;
}

let _storeId: number;
async function getStoreId() {
  if (!_storeId) {
    const { data } = await supabase
      .from("stores")
      .select()
      .eq("name", "Uniqlo US")
      .single();
    if (!data) {
      console.error("Could not find Uniqlo US store");
      return null;
    }
    _storeId = data.id;
  }
  return _storeId;
}

// TODO: cache product ids to save on DB reads and error handling
async function getDbProductId(productId: string) {
  const storeId = await getStoreId();
  const { data, error } = await supabase
    .from("products")
    .select()
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  return data?.id;
}

function getProductId(productUrl: string) {
  const productIdRegex = /([a-zA-Z0-9]{7}-[0-9]{3})/g;
  const productIdFromUrl = productUrl.match(productIdRegex);
  return productIdFromUrl ? productIdFromUrl[0] : null;
}

export async function fetchAndStoreData(req: Request, res: Response) {
  const body: RequestBody = req.body;

  // TODO: more rigorous request body validation
  if (body.productUrl && body.productId) {
    res.status(400).json("Cannot provide both product URL and product ID");
  } else if (!body.productUrl && !body.productId) {
    res.status(400).json("Product URL or product ID required");
  }

  const productId = body.productId ?? getProductId(body.productUrl!);
  if (!productId) {
    res.status(400).json("Could not extract a valid product id");
    return;
  }
  const dbProductId = await getDbProductId(productId);

  // TODO: extract shape of result to a type
  if (!dbProductId) {
    res.status(400).json({
      status: "ERROR",
      error: "Product not found in products table",
    });
    return;
  }

  const itemData = await getProductData(productId);
  if (itemData.length === 0) {
    console.warn(`Retrieved no data for ${productId}`);
  }

  const dbItemData = itemData.map((item) => {
    return {
      product_id: dbProductId,
      ...item,
    };
  });
  const { error } = await supabase.from("prices").insert(dbItemData);
  if (error) {
    console.error(error);
  }

  res.status(200).json({
    status: "SUCCESS",
  });
}
