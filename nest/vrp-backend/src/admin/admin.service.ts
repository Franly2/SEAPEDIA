/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async getUsersDetailStats() {
    const users = await this.prisma.user.findMany({
      select: { id: true, username: true, fullName: true, roles: true }
    });

    const detailedUsers = await Promise.all(users.map(async (user) => {
      const totalBuy = await this.prisma.order.count({
        where: { buyerId: user.id }
      });

      const totalSell = await this.prisma.order.count({
        where: { store: { ownerId: user.id } }
      });

      const spendAgg = await this.prisma.order.aggregate({
        _sum: { finalTotal: true },
        where: { 
          buyerId: user.id, 
          status: { not: OrderStatus.DIKEMBALIKAN } 
        }
      });

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        roles: user.roles,
        totalBuy,
        totalSell,
        totalSpend: spendAgg._sum.finalTotal || 0
      };
    }));

    return detailedUsers;
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
  
  async getStoresDetailStats() {
    const stores = await this.prisma.store.findMany({
      include: {
        owner: { select: { fullName: true, username: true } },
        _count: { select: { products: true, orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const detailedStores = await Promise.all(stores.map(async (store) => {
      const incomeAgg = await this.prisma.order.aggregate({
        _sum: { subtotal: true },
        where: { 
          storeId: store.id, 
          status: { not: OrderStatus.DIKEMBALIKAN }
        }
      });

      return {
        id: store.id,
        name: store.name,
        ownerName: store.owner.fullName,
        ownerUsername: store.owner.username,
        totalProducts: store._count.products,
        totalOrders: store._count.orders,
        totalIncome: incomeAgg._sum.subtotal || 0
      };
    }));

    return detailedStores;
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

  async getProductsDetailStats() {
    const products = await this.prisma.product.findMany({
      include: {
        store: { select: { name: true } },
        orderItems: {
          where: { order: { status: { not: OrderStatus.DIKEMBALIKAN } } }, 
          select: { quantity: true, priceAtBuy: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return products.map(p => {
      const pcsSold = p.orderItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalRevenue = p.orderItems.reduce((acc, curr) => acc + (curr.quantity * curr.priceAtBuy), 0);

      return {
        id: p.id,
        name: p.name,
        storeName: p.store.name,
        price: p.price,
        stock: p.stock,
        pcsSold,
        totalRevenue
      };
    });
  }

  async getOrdersDetailStats(isOverdue: boolean) {
    const whereClause = isOverdue ? { status: OrderStatus.DIKEMBALIKAN } : {};
    
    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        buyer: { select: { username: true } },
        store: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders.map(o => ({
      id: o.id,
      buyerUsername: o.buyer.username,
      storeName: o.store.name,
      status: o.status,
      finalTotal: o.finalTotal,
      createdAt: o.createdAt
    }));
  }
  
  async getDeliveriesDetailStats() {
    const deliveries = await this.prisma.deliveryJob.findMany({
      include: {
        driver: { select: { username: true } },
        order: { select: { status: true } }
      },
      orderBy: { takenAt: 'desc' } 
    });

    return deliveries.map(d => ({
      id: d.id,
      orderId: d.orderId,
      driverUsername: d.driver?.username || 'Belum Ada Kurir',
      fee: d.driverFee,
      status: d.order.status
    }));
  }

  async deleteVoucher(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } }
    });

    if (!voucher) {
      throw new NotFoundException('Voucher tidak ditemukan.');
    }

    if (voucher._count.orders > 0) {
      throw new BadRequestException('Voucher tidak bisa dihapus karena sudah memiliki riwayat penggunaan pada pesanan.');
    }

    await this.prisma.voucher.delete({ where: { id } });
    return { message: `Voucher ${voucher.code} berhasil dihapus.` };
  }

  async deletePromo(id: string) {
    const promo = await this.prisma.promo.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } }
    });

    if (!promo) {
      throw new NotFoundException('Promo tidak ditemukan.');
    }

    if (promo._count.orders > 0) {
      throw new BadRequestException('Promo tidak bisa dihapus karena sudah memiliki riwayat penggunaan pada pesanan.');
    }

    await this.prisma.promo.delete({ where: { id } });
    return { message: `Promo ${promo.code} berhasil dihapus.` };
  }
}