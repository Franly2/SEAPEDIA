/* eslint-disable prettier/prettier */
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; 

export const ROLES_KEY = 'roles';
// Decorator ini menerima spread array dari Enum Role (ADMIN, SELLER, BUYER, DRIVER)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);