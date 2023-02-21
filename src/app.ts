import express, { Application, Request, Response } from "express";
import { getItemData } from "./services/uniqlo";

const app: Application = express();
const PORT: number = 3001;

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello world!");
});

app.get("/uniqlo", async (req: Request, res: Response) => {
  console.log("uniqlo");
  const itemData = await getItemData(
    "https://www.uniqlo.com/us/en/products/E457967-000/00?colorDisplayCode=56&sizeDisplayCode=028"
  );

  const dataObject: any = {};
  itemData.forEach((item, key) => {
    dataObject[key] = Object.fromEntries(item);
  });

  res.json(dataObject);
});

app.listen(PORT, (): void => {
  console.log(`Running on http://localhost:${PORT}`);
});
