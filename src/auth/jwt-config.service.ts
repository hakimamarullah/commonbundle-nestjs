import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import * as process from 'process';
import { HttpClientBase } from '../http/http-client.base';
import { HttpMethod } from '../http/enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService
  extends HttpClientBase
  implements JwtOptionsFactory, OnModuleInit
{
  constructor(private configService: ConfigService) {
    super();
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

  async onModuleInit(): Promise<any> {
    this.logger = new Logger(JwtConfigService.name);
    this.initConfig(false, {
      baseURL: this.configService.get<string>('AUTH_BASE_URL', ''),
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('AUTH_BEARER_TOKEN')}`,
      },
    });
  }
}
