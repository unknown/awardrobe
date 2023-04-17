import { Request, Response, Router } from "express";
import { HeartbeatRequest, HeartbeatResponse } from "./uniqlo.types";
import { handleHeartbeat } from "./uniqlo.service";

export const uniqloRouter = Router();

uniqloRouter.post(
  "/",
  async (req: Request<HeartbeatRequest>, res: Response<HeartbeatResponse>) => {
    try {
      res.status(200).json(await handleHeartbeat(req.body));
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", error: "Internal server error" });
    }
  }
);
