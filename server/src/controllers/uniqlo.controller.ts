import { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getItemData } from "../services/uniqlo";

interface RequestBody {
  productUrl: string;
  productId: string;
}

// TODO: cache product ids to save on DB reads and error handling
async function getDbProductId(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select()
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  return data?.id;
}

function getProductId(productUrl: string, productId: string) {
  // TODO: handle invalid urls
  const productIdRegex = /([a-zA-Z0-9]{7}-[0-9]{3})/g;
  const productIdFromUrl = productUrl && productUrl.match(productIdRegex)![0];
  return productId ?? productIdFromUrl;
}

export async function getData(req: Request, res: Response) {
  const body: RequestBody = req.body;

  // TODO: more rigorous request body validation
  if (body.productUrl && body.productId) {
    res.status(400).json("Cannot provide both product URL and product ID");
  } else if (!body.productUrl && !body.productId) {
    res.status(400).json("Product URL or product ID required");
  }

  const productId = getProductId(body.productUrl, body.productId);

  console.log(`Getting data for item ${productId}`);
  const itemData = await getItemData(productId);

  const dbProductId = await getDbProductId(productId);
  if (dbProductId) {
    console.log(`Saving data for item ${productId}`);
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
  }

  res.status(200).json(itemData);
}
