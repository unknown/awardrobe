import * as dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { getItemData } from "@/services/uniqlo";
import { supabase } from "@/lib/supabase";

const app: Application = express();
const PORT: number = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello world!");
});

interface RequestBody {
  productUrl: string;
  productId: string;
}

app.get("/uniqlo-us", async (req: Request, res: Response) => {
  const { productUrl, productId }: RequestBody = req.body;

  // TODO: more rigorous request body validation
  if (productUrl && productId) {
    res.status(400).json("Cannot provide both product URL and product ID");
  } else if (!productUrl && !productId) {
    res.status(400).json("Product URL or product ID required");
  }

  // TODO: handle invalid urls
  const productIdRegex = /([a-zA-Z0-9]{7}-[0-9]{3})/g;
  const productIdFromUrl = productUrl && productUrl.match(productIdRegex)![0];

  const itemProductId = productId ?? productIdFromUrl;
  console.log(`Getting data for item ${itemProductId}`);
  const itemData = await getItemData(itemProductId);

  const { error } = await supabase.from("prices").insert(itemData);
  if (error) {
    console.error(error);
  }

  res.status(200).json(itemData);
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
