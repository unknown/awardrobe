import { Router } from "express";
import { fetchAndStoreData } from "../controllers/uniqlo.controller";

export const uniqloRouter = Router();

uniqloRouter.post("/", fetchAndStoreData);
