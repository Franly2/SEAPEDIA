/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 

import { TransactionType } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  // Mengambil informasi saldo saat ini beserta riwayat transaksinya
  async getWalletDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const history = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      balance: user.walletBalance,
      history,
    };
  }

  // Simulasi Top Up (Isi Saldo)
  async topUp(userId: string, amount: number) {
    // Menggunakan Prisma $transaction agar jika salah satu gagal, semuanya dibatalkan (Rollback)
    return this.prisma.$transaction(async (prisma) => {
      
      // 1. Tambahkan saldo ke profil pengguna
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          walletBalance: { increment: amount } 
        },
      });

      // 2. Catat riwayat mutasi uang masuk
      const transaction = await prisma.walletTransaction.create({
        data: {
          userId,
          amount,
          type: TransactionType.TOP_UP,
          description: 'Top Up Saldo Pembeli (Dummy)',
        },
      });

      return {
        message: 'Top-up berhasil!',
        newBalance: updatedUser.walletBalance,
        transaction,
      };
    });
  }
}