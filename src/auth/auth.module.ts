import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './jwt-config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CachingService } from '../caching/caching.service';

@Module({
  providers: [JwtConfigService, ConfigService, CachingService],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useClass: JwtConfigService,
      inject: [JwtConfigService, ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
  ],
})
export class AuthModule {}
