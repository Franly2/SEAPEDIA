/* eslint-disable prettier/prettier */
// src/delivery/delivery.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { OrderStatus, TransactionType } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Dapatkan Bursa Pekerjaan (Hanya yang Menunggu Pengirim)
  async getAvailableJobs() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.MENUNGGU_PENGIRIM },
      include: {
        store: { select: { name: true, owner: { select: { fullName: true } } } },
        address: true,
        buyer: { select: { fullName: true, username: true } },
      },
      orderBy: { updatedAt: 'asc' }, // Prioritaskan pesanan yang paling lama menunggu
    });
  }

  // 2. Ambil Pekerjaan (Mencegah Race Condition dengan $transaction)
  async takeJob(driverId: string, orderId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (!order) throw new NotFoundException('Pesanan tidak ditemukan.');
      if (order.status !== OrderStatus.MENUNGGU_PENGIRIM) {
        throw new BadRequestException('Maaf, pesanan ini sudah diambil oleh kurir lain atau dibatalkan.');
      }

      // Validasi Ekstra: Pastikan belum ada record di DeliveryJob
      const existingJob = await prisma.deliveryJob.findFirst({ where: { orderId } });
      if (existingJob) {
        throw new BadRequestException('Terjadi bentrok data. Pesanan sudah memiliki kurir.');
      }

      // Update status pesanan ke SEDANG_DIKIRIM
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SEDANG_DIKIRIM,
          statusHistory: {
            create: { status: OrderStatus.SEDANG_DIKIRIM },
          },
        },
      });

      // Buat kontrak kerja untuk kurir
      const job = await prisma.deliveryJob.create({
        data: {
          orderId,
          driverId,
          driverFee: order.deliveryFee, // Upah diambil dari ongkir pesanan
          takenAt: new Date(),
        },
      });

      return { message: 'Pekerjaan berhasil diambil!', job };
    });
  }

  // 3. Selesaikan Pekerjaan & Cairkan Upah
  async completeJob(driverId: string, orderId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // Pastikan pekerjaan ini benar-benar milik kurir yang memanggil API
      const job = await prisma.deliveryJob.findFirst({
        where: { orderId, driverId },
        include: { order: true },
      });

      if (!job) throw new ForbiddenException('Akses ditolak. Ini bukan pekerjaan Anda.');
      if (job.order.status !== OrderStatus.SEDANG_DIKIRIM) {
        throw new BadRequestException('Status pesanan tidak valid untuk diselesaikan.');
      }

      // Ubah status jadi PESANAN_SELESAI
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PESANAN_SELESAI,
          statusHistory: {
            create: { status: OrderStatus.PESANAN_SELESAI },
          },
        },
      });

      // Tambahkan Upah ke Dompet Kurir
      await prisma.user.update({
        where: { id: driverId },
        data: { walletBalance: { increment: job.driverFee } },
      });

      // Catat di Buku Besar (Ledger) sebagai Pemasukan (INCOME)
      await prisma.walletTransaction.create({
        data: {
          userId: driverId,
          amount: job.driverFee,
          type: TransactionType.INCOME, // Pastikan 'INCOME' ada di enum Prisma Anda, atau sesuaikan dengan enum yang Anda miliki (misal 'EARNING').
          description: `Upah Pengiriman Pesanan #${orderId.slice(-6).toUpperCase()}`,
        },
      });

      return { message: 'Pengiriman selesai! Upah telah masuk ke dompet Anda.' };
    });
  }

  // 4. API Bantuan: Pekerjaan Aktif & Riwayat Kurir
  async getMyJobs(driverId: string, status: 'ACTIVE' | 'COMPLETED') {
    const orderStatus = status === 'ACTIVE' ? OrderStatus.SEDANG_DIKIRIM : OrderStatus.PESANAN_SELESAI;
    
    return this.prisma.deliveryJob.findMany({
      where: { driverId, order: { status: orderStatus } },
      include: {
        order: {
          include: { store: true, address: true, buyer: { select: { fullName: true } } }
        }
      },
      orderBy: { takenAt: 'desc' },
    });
  }

  // 5. Total Pendapatan Kurir
  async getEarnings(driverId: string) {
    const jobs = await this.prisma.deliveryJob.findMany({
      where: { driverId, order: { status: OrderStatus.PESANAN_SELESAI } },
    });
    
    const totalPendapatan = jobs.reduce((sum, job) => sum + job.driverFee, 0);
    return { totalJobs: jobs.length, totalPendapatan };
  }
}