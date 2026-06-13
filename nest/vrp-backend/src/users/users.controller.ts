/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { GetUser } from '../auth/get-user.decorator'; 

import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('upgrade-role')
  async upgradeRole(
    @GetUser('userId') userId: string,
    @Body('role') role: string,
  ) {
    if (role !== 'SELLER' && role !== 'DRIVER') {
      throw new BadRequestException('Role tidak valid. Hanya bisa upgrade ke SELLER atau DRIVER.');
    }

    return this.usersService.addRoleToUser(userId, role as Role);
  }
}