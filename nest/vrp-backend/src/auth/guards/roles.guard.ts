/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; 

    if (!user || !user.activeRole) {
      throw new ForbiddenException('Akses Ditolak: Anda belum memilih Peran Aktif (Active Role).');
    }

    const hasRole = requiredRoles.includes(user.activeRole);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Akses Ilegal: Endpoint ini khusus ${requiredRoles.join(' / ')}. Active Role Anda saat ini adalah ${user.activeRole}.`
      );
    }

    return true;
  }
}