/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async addRoleToUser(userId: string, newRole: Role) {
    // Cari data pengguna saat ini
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    // Cek apakah pengguna sudah memiliki peran tersebut
    if (user.roles.includes(newRole)) {
      throw new ConflictException(`Anda sudah memiliki peran ${newRole}.`);
    }

    // Gabungkan array peran lama dengan peran baru
    const updatedRoles = [...user.roles, newRole];

    // Simpan ke database
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