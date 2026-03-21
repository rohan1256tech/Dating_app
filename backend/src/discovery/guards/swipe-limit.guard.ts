import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * SwipeLimitGuard — DISABLED for v1 free release.
 * All users get unlimited swipes. Premium tiers will be reintroduced in a future version.
 */
@Injectable()
export class SwipeLimitGuard implements CanActivate {
    async canActivate(_context: ExecutionContext): Promise<boolean> {
        return true; // No swipe limits — all features free in v1
    }
}
