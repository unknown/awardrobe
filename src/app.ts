import * as dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { getItemData } from "./services/uniqlo";
import { supabase } from "./lib/supabase";

const app: Application = express();
const PORT: number = 3001;

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello world!");
});

app.get("/uniqlo", async (req: Request, res: Response) => {
  const itemData = await getItemData(
    "https://www.uniqlo.com/us/en/products/E457967-000/00?colorDisplayCode=56&sizeDisplayCode=028"
  );

  const { error } = await supabase.from("prices").insert(itemData);
  if (error) {
    console.error(error);
  }

  res.json(itemData);
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
