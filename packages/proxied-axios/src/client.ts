import Axios, { AxiosInstance, ResponseType } from "axios";

import { proxies } from "@awardrobe/proxies";

type RequestOptions = {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  responseType?: ResponseType;
};

type RequestResponse<TResponse> = {
  data: TResponse;
  status: number;
};

export class ProxiedClient {
  private readonly axios: AxiosInstance;

  // TODO: random user agent
  constructor() {
    this.axios = Axios.create({
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
      timeout: 30 * 1000,
    });
  }

  public async get<T = any>(
    url: string,
    options: RequestOptions = {},
  ): Promise<RequestResponse<T>> {
    const { params } = options;
    const { httpsAgent } = proxies.getRandomProxy();

    const { data, status } = await this.axios.get<T>(url, {
      httpsAgent,
      params,
    });

    return {
      data,
      status,
    };
  }
}
