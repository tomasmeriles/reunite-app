import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global JWT guard. Protects all routes by default.
 * Decorate a route with @Public() to opt out of authentication.
 *
 * For public routes the guard still attempts JWT validation so that
 * @CurrentUser() is populated for authenticated callers. Anonymous
 * requests (no token or invalid token) are allowed through silently.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      return super.canActivate(context) as Promise<boolean>;
    }

    // Silently attempt JWT auth so @CurrentUser() works for logged-in callers.
    // Allow the request through regardless of the outcome.
    try {
      await (super.canActivate(context) as Promise<boolean>);
    } catch {
      // No token or invalid token — treat as anonymous
    }
    return true;
  }
}
