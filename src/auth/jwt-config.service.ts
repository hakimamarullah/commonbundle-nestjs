import { Injectable, Logger } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import * as process from 'process';
import { HttpClientBase } from '../http/http-client.base';
import { HttpMethod } from '../http/enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService
  extends HttpClientBase
  implements JwtOptionsFactory
{
  constructor(private configService: ConfigService) {
    super();
    this.logger = new Logger(JwtConfigService.name);
    const authBaseURL = this.configService.get<string>('AUTH_BASE_URL');
    if (!authBaseURL) {
      this.logger.fatal('AUTH_BASE_URL is not provided');
      process.exit(1);
    }
    this.initConfig({
      enableLogger: true,
      options: {
        baseURL: authBaseURL,
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('AUTH_BEARER_TOKEN')}`,
        },
      },
    });
  }
  async createJwtOptions(): Promise<JwtModuleOptions> {
    const config = await this.loadJwtOptions();
    if (!config.secret || !config.signOptions) {
      this.logger.fatal('JWT_SECRET or JWT_EXPIRES is not defined');
      process.exit(1);
    }
    return config;
  }

  async loadJwtOptions(): Promise<JwtModuleOptions> {
    const { responseData } = await this.handleRequest(
      HttpMethod.GET,
      `/jwt/config`,
    );
    return responseData as JwtModuleOptions;
  }
}
