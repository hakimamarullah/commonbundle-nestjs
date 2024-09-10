import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from './decorator/public.decorator';
import { CachingService } from '../caching/caching.service';
import { HttpClientBase } from '../http/http-client.base';
import { ConfigService } from '@nestjs/config';
import { HttpMethod } from '../http/enum';
import { convertPatternToRegExp, convertTo } from '../common/utils';
import { CacheConstant } from '../caching/cache.constant';

@Injectable()
export class AuthGuard extends HttpClientBase implements CanActivate {
  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(Reflector)
  private reflector: Reflector;

  @Inject(CachingService)
  private cachingService: CachingService;

  @Inject(ConfigService)
  private configService: ConfigService;

  constructor() {
    super();
    this.logger = new Logger(AuthGuard.name);
    this.initConfig({
      options: {
        baseURL: this.configService.get<string>('AUTH_BASE_URL'),
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('AUTH_BEARER_TOKEN')}`,
        },
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userRoles = await this.getUserRoles(payload.sub);
      const paths = await this.getAllPaths();
      const pathsSet = await this.getPathPatternSet(
        userRoles ?? [],
        paths ?? {},
      );

      this.checkIsAllowed(pathsSet, request.path);
      (request as any)['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async getUserRoles(userId: number) {
    let roles = await this.cachingService.getRolesByUserId(userId);
    if (!roles) {
      const { responseData } = await this.handleRequest(
        HttpMethod.GET,
        `/roles/user/${userId}`,
      );
      roles = responseData as string[];
      await this.cachingService.setRoles(userId, responseData);
    }
    return roles;
  }

  private async getAllPaths() {
    let rolePaths = await this.cachingService.get<{
      [roleName: string]: RegExp[];
    }>(CacheConstant.CacheKey.ROLES_PATHS);

    if (!rolePaths) {
      const { responseData } = await this.handleRequest(
        HttpMethod.GET,
        `/roles/paths`,
      );

      if (!responseData) {
        throw new UnauthorizedException('Role paths not found');
      }
      rolePaths = await convertTo(responseData, convertPatternToRegExp);
      await this.cachingService.set(
        CacheConstant.CacheKey.ROLES_PATHS,
        rolePaths,
      );
    }

    return rolePaths;
  }

  private async getPathPatternSet(
    userRoles: string[],
    paths: { [roleName: string]: RegExp[] },
  ) {
    const patternSet = new Set<RegExp>();
    for (const role of userRoles) {
      const userPaths = paths[role];
      if (userPaths) {
        userPaths.forEach((pattern) => {
          patternSet.add(pattern);
        });
      }
    }
    return patternSet;
  }

  private checkIsAllowed(pathPatternSet: Set<RegExp>, path: string) {
    const anyMatchedPath = Array.from(pathPatternSet).some((pattern) =>
      pattern.test(path),
    );
    if (!pathPatternSet?.size || !anyMatchedPath) {
      throw new UnauthorizedException(
        'You are not allowed to access this path',
      );
    }
    return true;
  }
}
