/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async createStore(userId: string, dto: CreateStoreDto) {
    const existingUserStore = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (existingUserStore) {
      throw new ConflictException('Akun Anda sudah memiliki toko terdaftar. Satu pengguna hanya boleh memiliki satu toko.');
    }

    const existingStoreName = await this.prisma.store.findUnique({
      where: { name: dto.name },
    });

    if (existingStoreName) {
      throw new ConflictException(`Nama toko "${dto.name}" sudah digunakan oleh penjual lain.`);
    }

    return this.prisma.store.create({
      data: {
        name: dto.name,
        ownerId: userId,
      },
    });
  }

  async getMyStore(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
      include: {
        products: true, 
      },
    });

    if (!store) {
      throw new NotFoundException('Anda belum memiliki toko terdaftar.');
    }

    return store;
  }

  async updateStore(userId: string, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new NotFoundException('Toko tidak ditemukan atau Anda bukan pemilik toko ini.');
    }

    if (store.name !== dto.name) {
      const nameTaken = await this.prisma.store.findUnique({
        where: { name: dto.name },
      });

      if (nameTaken) {
        throw new ConflictException(`Nama toko "${dto.name}" sudah digunakan oleh penjual lain.`);
      }
    }

    return this.prisma.store.update({
      where: { ownerId: userId },
      data: { name: dto.name },
    });
  }
}