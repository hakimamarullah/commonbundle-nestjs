import { Logger } from '@nestjs/common';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  CreateAxiosDefaults,
} from 'axios';
import { HttpMethodType } from './enum';

export abstract class HttpClientBase {
  protected httpClient: AxiosInstance;
  protected logger: Logger = new Logger(HttpClientBase.name);

  /**
   * Handles an HTTP request using the configured HTTP client.
   *
   * This function sends an HTTP request to the specified path with the given method, payload, and configuration.
   * It returns the data from the response.
   *
   * @param {HttpMethodType} method - The HTTP method to use for the request (e.g., GET, POST, PUT, etc.)
   * @param {string} path - The URL path for the request
   * @param {Record<string, any>} [payload] - The request payload (optional)
   * @param {AxiosRequestConfig} [config] - The request configuration (optional)
   * @return {any} The data from the response
   */
  protected async handleRequest(
    method: HttpMethodType,
    path: string,
    payload?: Record<string, any>,
    config: AxiosRequestConfig = {},
  ) {
    const { data } = await this.httpClient.request({
      method,
      url: path,
      data: payload,
      timeout: 10000,
      ...config,
    } as AxiosRequestConfig);
    return data;
  }

  /**
   * Initializes the HTTP client logger.
   *
   * This function sets up interceptors for the HTTP client to log the request and response.
   * It logs the request details and the response status and data.
   *
   * @return {void}
   */
  protected initClientLogger() {
    this.logger.debug('INITIATE HTTP CLIENT LOGGER');
    this.httpClient.interceptors.request.use((request) => {
      const { method, url, headers, data } = request;
      this.logger.debug(
        'Starting Request',
        JSON.stringify({ method, url, headers, data }, null, 2),
      );
      return request;
    });

    this.httpClient.interceptors.response.use((response) => {
      const { status, data } = response;
      this.logger.debug('Response:', JSON.stringify({ status, data }, null, 2));
      return response;
    });
    this.logger.debug('END INITIATE HTTP CLIENT LOGGER');
  }

  /**
   * Initializes the HTTP client configuration.
   *
   * This function sets up the HTTP client with the provided options and enables the logger if specified.
   *
   * @param {boolean} [enableLogger] - Whether to enable the HTTP client logger.
   * @param {CreateAxiosDefaults} [options] - The options to configure the HTTP client.
   * @return {void}
   */
  public initConfig(enableLogger?: boolean, options?: CreateAxiosDefaults) {
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
      validateStatus: () => true,
      ...options,
    });

    if (enableLogger) {
      this.initClientLogger();
    }
  }
}
