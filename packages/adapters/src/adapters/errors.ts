import { AxiosError } from "axios";

export const AdaptersErrorNames = ["PRODUCT_NOT_FOUND"] as const;
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
        name: "PRODUCT_NOT_FOUND",
        message: "Request returned status code 404",
        cause: error,
      });
    }
  }
  throw error;
}
