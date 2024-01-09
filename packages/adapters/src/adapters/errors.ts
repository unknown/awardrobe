import { AxiosError } from "axios";

export const AdaptersErrorNames = ["DELISTED_PRODUCT"] as const;
export type AdaptersErrorName = (typeof AdaptersErrorNames)[number];

export class AdaptersError extends Error {
  name: AdaptersErrorName;
  message: string;
  cause: any;

  constructor({ name, message, cause }: { name: AdaptersErrorName; message: string; cause?: any }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export function handleAxiosError(error: any): never {
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) {
      throw new AdaptersError({
        name: "DELISTED_PRODUCT",
        message: "Product is delisted.",
        cause: error,
      });
    }
  }
  throw error;
}
