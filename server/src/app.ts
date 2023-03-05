import * as dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { uniqloRouter } from "./routes/uniqlo.route";

const app: Application = express();
const PORT: number = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello world!");
});

app.use("/uniqlo-us", uniqloRouter);

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
