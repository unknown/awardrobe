import { Request, Response, Router } from "express";
import {
  AddProductRequest,
  AddProductResponse,
  HeartbeatRequest,
  HeartbeatResponse,
} from "./uniqlo.types";
import { addProduct, handleHeartbeat } from "./uniqlo.service";

export const uniqloRouter = Router();

uniqloRouter.post(
  "/heartbeat",
  async (req: Request<HeartbeatRequest>, res: Response<HeartbeatResponse>) => {
    try {
      res.status(200).json(await handleHeartbeat(req.body));
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", error: "Internal server error" });
    }
  }
);

uniqloRouter.post(
  "/add-product",
  async (req: Request<AddProductRequest>, res: Response<AddProductResponse>) => {
    try {
      res.status(200).json(await addProduct(req.body));
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", error: "Internal server error" });
    }
  }
);
