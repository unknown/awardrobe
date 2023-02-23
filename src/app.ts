import * as dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { getItemData } from "./services/uniqlo";
import { supabase } from "./lib/supabase";

const app: Application = express();
const PORT: number = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello world!");
});

app.get("/uniqlo", async (req: Request, res: Response) => {
  const { productUrl } = req.body;

  console.log(productUrl);

  // TODO: more rigorous request body validation
  if (!productUrl) {
    res.status(400).json("Missing product URL");
  }

  const itemData = await getItemData(productUrl);

  const { error } = await supabase.from("prices").insert(itemData);
  if (error) {
    console.error(error);
  }

  res.status(200).json(itemData);
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
