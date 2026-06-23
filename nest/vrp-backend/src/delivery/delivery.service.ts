/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { OrderStatus, TransactionType } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableJobs() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.MENUNGGU_PENGIRIM },
      include: {
        store: { select: { name: true, owner: { select: { fullName: true } } } },
        address: true,
        buyer: { select: { fullName: true, username: true } },
      },
      orderBy: { updatedAt: 'asc' }, 
    });
  }

  async takeJob(driverId: string, orderId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (!order) throw new NotFoundException('Pesanan tidak ditemukan.');
      if (order.status !== OrderStatus.MENUNGGU_PENGIRIM) {
        throw new BadRequestException('Maaf, pesanan ini sudah diambil oleh kurir lain atau dibatalkan.');
      }

      const existingJob = await prisma.deliveryJob.findFirst({ where: { orderId } });
      if (existingJob) {
        throw new BadRequestException('Terjadi bentrok data. Pesanan sudah memiliki kurir.');
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.SEDANG_DIKIRIM,
          statusHistory: {
            create: { status: OrderStatus.SEDANG_DIKIRIM },
          },
        },
      });

      const job = await prisma.deliveryJob.create({
        data: {
          orderId,
          driverId,
          driverFee: order.deliveryFee,
          takenAt: new Date(),
        },
      });

      return { message: 'Pekerjaan berhasil diambil!', job };
    });
  }

  async completeJob(driverId: string, orderId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const job = await prisma.deliveryJob.findFirst({
        where: { orderId, driverId },
        include: { order: true },
      });

      if (!job) throw new ForbiddenException('Akses ditolak. Ini bukan pekerjaan Anda.');
      if (job.order.status !== OrderStatus.SEDANG_DIKIRIM) {
        throw new BadRequestException('Status pesanan tidak valid untuk diselesaikan.');
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PESANAN_SELESAI,
          statusHistory: {
            create: { status: OrderStatus.PESANAN_SELESAI },
          },
        },
      });

      await prisma.user.update({
        where: { id: driverId },
        data: { walletBalance: { increment: job.driverFee } },
      });

      await prisma.walletTransaction.create({
        data: {
          userId: driverId,
          amount: job.driverFee,
          type: TransactionType.INCOME, 
          description: `Upah Pengiriman Pesanan #${orderId.slice(-6).toUpperCase()}`,
        },
      });

      return { message: 'Pengiriman selesai! Upah telah masuk ke dompet Anda.' };
    });
  }

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

  async getEarnings(driverId: string) {
    const jobs = await this.prisma.deliveryJob.findMany({
      where: { driverId, order: { status: OrderStatus.PESANAN_SELESAI } },
    });
    
    const totalPendapatan = jobs.reduce((sum, job) => sum + job.driverFee, 0);
    return { totalJobs: jobs.length, totalPendapatan };
  }
}