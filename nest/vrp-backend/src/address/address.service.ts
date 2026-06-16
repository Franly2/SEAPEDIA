/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
// src/address/address.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 

import { CreateAddressDto } from './dto/create-address.dto';
import {UpdateAddressDto} from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tambah Alamat Baru
  async create(userId: string, dto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        addressLine: dto.addressLine,
      },
    });
  }

  // 2. Ambil Semua Alamat milik User yang sedang login
  async findAllByUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { label: 'asc' }, // Urutkan sesuai abjad label
    });
  }

  // 3. Edit Alamat
  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    // Cek apakah alamat ada dan milik user ini
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    
    if (!address) throw new NotFoundException('Alamat tidak ditemukan.');
    if (address.userId !== userId) throw new ForbiddenException('Akses ditolak. Ini bukan alamat Anda.');

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  // 4. Hapus Alamat
  async remove(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    
    if (!address) throw new NotFoundException('Alamat tidak ditemukan.');
    if (address.userId !== userId) throw new ForbiddenException('Akses ditolak. Ini bukan alamat Anda.');

    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Alamat berhasil dihapus.' };
  }
}