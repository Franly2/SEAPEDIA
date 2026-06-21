/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
// src/discount/discount.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { CreateVoucherDto, CreatePromoDto } from './dto/discount.dto';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================
  // 1. ADMIN: Buat Voucher & Promo
  // =====================================
  async createVoucher(dto: CreateVoucherDto) {
    const existing = await this.prisma.voucher.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Kode Voucher sudah digunakan.');

    return this.prisma.voucher.create({
      data: {
        code: dto.code,
        discountValue: dto.discountValue,
        expiryDate: new Date(dto.expiryDate),
        usageQuota: dto.usageQuota,
      },
    });
  }

  async createPromo(dto: CreatePromoDto) {
    const existing = await this.prisma.promo.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Kode Promo sudah digunakan.');

    return this.prisma.promo.create({
      data: {
        code: dto.code,
        discountValue: dto.discountValue,
        expiryDate: new Date(dto.expiryDate),
      },
    });
  }

  // =====================================
  // 2. PUBLIC/ADMIN: Lihat Daftar Diskon
  // =====================================
  async getAllDiscounts() {
    const vouchers = await this.prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
    const promos = await this.prisma.promo.findMany({ orderBy: { createdAt: 'desc' } });
    
    return { vouchers, promos };
  }

  // =====================================
  // 3. BUYER: Validasi Kode saat Checkout
  // =====================================
  async validateCode(code: string) {
    const now = new Date();

    // 1. Coba cari di tabel Voucher
    const voucher = await this.prisma.voucher.findUnique({ where: { code } });
    if (voucher) {
      if (voucher.expiryDate < now) {
        throw new BadRequestException('Voucher ini sudah kedaluwarsa.');
      }
      if (voucher.usageQuota <= 0) {
        throw new BadRequestException('Kuota penggunaan voucher ini sudah habis.');
      }
      return {
        valid: true,
        type: 'VOUCHER',
        id: voucher.id,
        code: voucher.code,
        discountValue: voucher.discountValue,
      };
    }

    // 2. Jika tidak ada di Voucher, cari di tabel Promo
    const promo = await this.prisma.promo.findUnique({ where: { code } });
    if (promo) {
      if (promo.expiryDate < now) {
        throw new BadRequestException('Promo ini sudah kedaluwarsa.');
      }
      return {
        valid: true,
        type: 'PROMO',
        id: promo.id,
        code: promo.code,
        discountValue: promo.discountValue,
      };
    }

    // 3. Jika tidak ada di keduanya
    throw new NotFoundException('Kode diskon tidak ditemukan atau tidak valid.');
  }
}