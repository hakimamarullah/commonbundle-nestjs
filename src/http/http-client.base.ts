import { Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HttpMethodType } from './enum';
import { ConfigService } from '@nestjs/config';

export interface InitialConfigOptions {
  BASE_URL_KEY_NAME?: string;
  HTTP_CLIENT_TIMEOUT?: string;
  AUTH_BEARER_TOKEN?: string;
  validateStatus?: (status: number) => boolean;
}
export abstract class HttpClientBase {
  protected httpClient: AxiosInstance;
  protected logger: Logger = new Logger(HttpClientBase.name);

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

  protected initLogger() {
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

  public initConfig(
    configService: ConfigService,
    options?: InitialConfigOptions,
  ) {
    const {
      BASE_URL_KEY_NAME,
      HTTP_CLIENT_TIMEOUT,
      AUTH_BEARER_TOKEN,
      validateStatus,
    } = options || {};
    this.httpClient = axios.create({
      baseURL: configService.get<string>(
        BASE_URL_KEY_NAME ?? 'AUTH_BASE_URL',
        'http://localhost:3000',
      ),
      timeout: configService.get<number>(
        HTTP_CLIENT_TIMEOUT ?? 'HTTP_CLIENT_TIMEOUT',
        10000,
      ),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${configService.get<string>(AUTH_BEARER_TOKEN ?? 'AUTH_BEARER_TOKEN')}`,
      },
      validateStatus: validateStatus ?? (() => true),
    });

    const activateLogging = configService.get<boolean>('AXIOS_LOGGING', false);
    if (activateLogging) {
      this.initLogger();
    }
  }
}
