/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async addRoleToUser(userId: string, newRole: Role) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (user.roles.includes(newRole)) {
      throw new ConflictException(`Anda sudah memiliki peran ${newRole}.`);
    }

    const updatedRoles = [...user.roles, newRole];

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: updatedRoles },
    });

    return {
      message: `Peran ${newRole} berhasil ditambahkan.`,
      roles: updatedUser.roles,
    };
  }
}