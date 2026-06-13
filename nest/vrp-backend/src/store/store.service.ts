/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. POST /stores -> Membuat toko baru
  async createStore(userId: string, dto: CreateStoreDto) {
    // Validasi A: Cek apakah pengguna sudah memiliki toko
    const existingUserStore = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (existingUserStore) {
      throw new ConflictException('Akun Anda sudah memiliki toko terdaftar. Satu pengguna hanya boleh memiliki satu toko.');
    }

    // Validasi B: Cek keunikan nama toko di database
    const existingStoreName = await this.prisma.store.findUnique({
      where: { name: dto.name },
    });

    if (existingStoreName) {
      throw new ConflictException(`Nama toko "${dto.name}" sudah digunakan oleh penjual lain.`);
    }

    // Simpan toko baru ke database
    return this.prisma.store.create({
      data: {
        name: dto.name,
        ownerId: userId,
      },
    });
  }

  // 2. GET /stores/my-store -> Mengambil profil toko milik user login
  async getMyStore(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
      include: {
        products: true, // Sekaligus mengambil daftar produk miliknya untuk dasbor seller nanti
      },
    });

    if (!store) {
      throw new NotFoundException('Anda belum memiliki toko terdaftar.');
    }

    return store;
  }

  // 3. PUT /stores/my-store -> Mengupdate nama toko
  async updateStore(userId: string, dto: UpdateStoreDto) {
    // Cek apakah toko tersebut memang ada
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new NotFoundException('Toko tidak ditemukan atau Anda bukan pemilik toko ini.');
    }

    // Cek apakah nama baru sudah dipakai oleh toko lain (kecuali toko milik sendiri)
    if (store.name !== dto.name) {
      const nameTaken = await this.prisma.store.findUnique({
        where: { name: dto.name },
      });

      if (nameTaken) {
        throw new ConflictException(`Nama toko "${dto.name}" sudah digunakan oleh penjual lain.`);
      }
    }

    // Update nama toko
    return this.prisma.store.update({
      where: { ownerId: userId },
      data: { name: dto.name },
    });
  }
}