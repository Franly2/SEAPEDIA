/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 

import { CreateAddressDto } from './dto/create-address.dto';
import {UpdateAddressDto} from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        addressLine: dto.addressLine,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { label: 'asc' }, 
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    
    if (!address) throw new NotFoundException('Alamat tidak ditemukan.');
    if (address.userId !== userId) throw new ForbiddenException('Akses ditolak. Ini bukan alamat Anda.');

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async remove(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    
    if (!address) throw new NotFoundException('Alamat tidak ditemukan.');
    if (address.userId !== userId) throw new ForbiddenException('Akses ditolak. Ini bukan alamat Anda.');

    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Alamat berhasil dihapus.' };
  }
}