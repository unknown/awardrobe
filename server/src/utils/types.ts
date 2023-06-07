import { Database } from "./database.types";

export type PricesEntry = Database["public"]["Tables"]["prices"]["Insert"];

export type ProductsEntry = Database["public"]["Tables"]["products"]["Insert"];
