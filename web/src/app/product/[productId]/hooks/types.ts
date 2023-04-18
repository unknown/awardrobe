import { Database } from "@/lib/db-types";

export type Prices = Database["public"]["Tables"]["prices"]["Row"];

export type PricesOptions = {
  style?: string;
  size?: string;
  startDate?: Date;
  abortSignal?: AbortSignal;
};
