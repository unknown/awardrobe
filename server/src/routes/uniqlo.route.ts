import { Router } from "express";
import { getData } from "../controllers/uniqlo.controller";

export const uniqloRouter = Router();

uniqloRouter.post("/", getData);
