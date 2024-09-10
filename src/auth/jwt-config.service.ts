import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import * as process from 'process';
import { ConfigService } from '@nestjs/config';
import { HttpClientBase } from '../http/http-client.base';
import { HttpMethod } from '../http/enum';

@Injectable()
export class JwtConfigService
  extends HttpClientBase
  implements JwtOptionsFactory
{
  constructor(private configService: ConfigService) {
    super();
    this.logger = new Logger(JwtConfigService.name);
    this.initConfig(this.configService);
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
