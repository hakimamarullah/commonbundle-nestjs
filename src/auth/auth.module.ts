import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './jwt-config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [JwtConfigService, ConfigService],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useClass: JwtConfigService,
      inject: [JwtConfigService, ConfigService],
    }),
  ],
})
export class AuthModule {}
