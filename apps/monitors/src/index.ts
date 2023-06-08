import * as dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { uniqloRouter } from "./monitors/uniqlo/uniqlo.router";

const app: Application = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_: Request, res: Response): void => {
  res.send("Monitors endpoint");
});

// monitor endpoints
app.use("/uniqlo-us", uniqloRouter);

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
