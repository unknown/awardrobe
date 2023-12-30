import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import { proxies } from "@awardrobe/proxies";

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
    options: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    const { httpsAgent } = proxies.getRandomProxy();

    const response = await this.axios.get<T>(url, {
      ...options,
      httpsAgent,
    });

    return response;
  }
}
