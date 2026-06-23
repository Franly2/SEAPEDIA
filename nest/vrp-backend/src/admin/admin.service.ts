/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { OrderStatus, DeliveryMethod, TransactionType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  async getDashboardStats() {
    const [
      totalUsers,
      totalStores,
      totalProducts,
      totalOrders,
      totalVouchers,
      totalPromos,
      totalDeliveryJobs, 
      ordersDikemas,
      ordersMenungguPengirim,
      ordersSedangDikirim,
      ordersOverdue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.store.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.voucher.count(),
      this.prisma.promo.count(),
      this.prisma.deliveryJob.count(), 
      this.prisma.order.count({ where: { status: OrderStatus.SEDANG_DIKEMAS } }),
      this.prisma.order.count({ where: { status: OrderStatus.MENUNGGU_PENGIRIM } }),
      this.prisma.order.count({ where: { status: OrderStatus.SEDANG_DIKIRIM } }),
      this.prisma.order.count({ where: { status: OrderStatus.DIKEMBALIKAN } }), 
    ]);

    return {
      totals: {
        users: totalUsers,
        stores: totalStores,
        products: totalProducts,
        orders: totalOrders,
        vouchers: totalVouchers,
        promos: totalPromos,
        deliveryJobs: totalDeliveryJobs,
        overdueOrders: ordersOverdue,   
      },
      activeOrders: {
        dikemas: ordersDikemas,
        menungguKurir: ordersMenungguPengirim,
        dalamPerjalanan: ordersSedangDikirim,
      },
    };
  }

  async getVouchers() {
    return this.prisma.voucher.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVoucher(dto: { code: string; discountValue: number; usageQuota: number; expiryDate: string }) {
    const existing = await this.prisma.voucher.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new BadRequestException('Kode Voucher sudah digunakan.');

    return this.prisma.voucher.create({
      data: {
        code: dto.code.toUpperCase(),
        discountValue: dto.discountValue,
        usageQuota: dto.usageQuota,
        expiryDate: new Date(dto.expiryDate),
      },
    });
  }

  async getPromos() {
    return this.prisma.promo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPromo(dto: { code: string; discountValue: number; expiryDate: string }) {
    const existing = await this.prisma.promo.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new BadRequestException('Kode Promo sudah digunakan.');

    return this.prisma.promo.create({
      data: {
        code: dto.code.toUpperCase(),
        discountValue: dto.discountValue,
        expiryDate: new Date(dto.expiryDate),
      },
    });
  }

  async simulateNextDay() {
    const activeOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.SEDANG_DIKEMAS, OrderStatus.MENUNGGU_PENGIRIM, OrderStatus.SEDANG_DIKIRIM]
        }
      }
    });

    for (const order of activeOrders) {
      const simulatedPastDate = new Date(order.createdAt);
      simulatedPastDate.setDate(simulatedPastDate.getDate() - 1);

      await this.prisma.order.update({
        where: { id: order.id },
        data: { createdAt: simulatedPastDate }
      });
    }

    return { message: 'Simulasi berhasil! Umur pesanan aktif telah dimajukan 1 hari lebih tua.' };
  }

  async triggerOverdueHandling() {
    const ordersToCheck = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.SEDANG_DIKEMAS, OrderStatus.MENUNGGU_PENGIRIM] }
      },
      include: { items: true }
    });

    const now = new Date();
    const refundedList: string[] = [];

    for (const order of ordersToCheck) {
      const timeDifferenceMs = now.getTime() - order.createdAt.getTime();
      const hoursPassed = timeDifferenceMs / (1000 * 60 * 60);

      let isOverdue = false;
      if (order.deliveryMethod === DeliveryMethod.INSTANT && hoursPassed >= 24) isOverdue = true;
      if (order.deliveryMethod === DeliveryMethod.NEXT_DAY && hoursPassed >= 48) isOverdue = true;
      if (order.deliveryMethod === DeliveryMethod.REGULAR && hoursPassed >= 72) isOverdue = true;

      if (isOverdue) {
        await this.prisma.$transaction(async (tx) => {
          const freshOrder = await tx.order.findUnique({ where: { id: order.id } });
          if (!freshOrder || freshOrder.status === OrderStatus.DIKEMBALIKAN) return;

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.DIKEMBALIKAN,
              statusHistory: {
                create: { status: OrderStatus.DIKEMBALIKAN }
              }
            }
          });

          await tx.user.update({
            where: { id: order.buyerId },
            data: { walletBalance: { increment: order.finalTotal } }
          });
          await tx.walletTransaction.create({
            data: {
              userId: order.buyerId,
              amount: order.finalTotal,
              type: TransactionType.REFUND, 
              description: `Refund Otomatis (SLA Overdue) Pesanan #${order.id.slice(-6).toUpperCase()}`
            }
          });

          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }

          refundedList.push(order.id.slice(-6).toUpperCase());
        });
      }
    }

    return {
      message: 'Pemindaian Overdue selesai.',
      totalRefunded: refundedList.length,
      refundedOrders: refundedList
    };
  }
}