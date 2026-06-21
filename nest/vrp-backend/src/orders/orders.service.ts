/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { CheckoutDto } from './dto/checkout.dto';
import { OrderStatus, DeliveryMethod, TransactionType } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================
  // 1. FUNGSI RAKSASA: PROSES CHECKOUT
  // =====================================
  async checkout(buyerId: string, dto: CheckoutDto) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId: buyerId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Keranjang belanjamu kosong.');
    }

    const storeId = cartItems[0].product.storeId;
    const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
    
    let deliveryFee = 0;
    if (dto.deliveryMethod === DeliveryMethod.INSTANT) deliveryFee = 20000;
    else if (dto.deliveryMethod === DeliveryMethod.NEXT_DAY) deliveryFee = 15000;
    else deliveryFee = 10000; 

    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { id: buyerId } });
      if (!user) throw new NotFoundException('Data pengguna tidak ditemukan.');

      let discountAmount = 0;
      const now = new Date();

      if (dto.voucherId) {
        const voucher = await prisma.voucher.findUnique({ where: { id: dto.voucherId } });
        if (!voucher || voucher.expiryDate < now || voucher.usageQuota <= 0) {
          throw new BadRequestException('Voucher tidak valid, kedaluwarsa, atau kuota habis.');
        }
        discountAmount += voucher.discountValue;
        
        await prisma.voucher.update({
          where: { id: dto.voucherId },
          data: { usageQuota: { decrement: 1 } }
        });
      }

      if (dto.promoId) {
        const promo = await prisma.promo.findUnique({ where: { id: dto.promoId } });
        if (!promo || promo.expiryDate < now) {
          throw new BadRequestException('Promo tidak valid atau kedaluwarsa.');
        }
        discountAmount += promo.discountValue;
      }

      const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
      const dpp = subtotalAfterDiscount + deliveryFee; 
      const ppnAmount = Math.round(dpp * 0.12);
      const finalTotal = dpp + ppnAmount;

      if (user.walletBalance < finalTotal) {
        throw new BadRequestException(`Saldo tidak mencukupi. Total tagihan: Rp ${finalTotal}`);
      }

      for (const item of cartItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundException(`Produk ${item.productId} tidak tersedia.`);
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stok ${product.name} tidak mencukupi (sisa ${product.stock}).`);
        }
      }

      await prisma.user.update({
        where: { id: buyerId },
        data: { walletBalance: { decrement: finalTotal } },
      });

      const order = await prisma.order.create({
        data: {
          buyerId,
          storeId,
          addressId: dto.addressId,
          subtotal,
          discountAmount, 
          voucherId: dto.voucherId || null, 
          promoId: dto.promoId || null,     
          deliveryFee,
          ppnAmount,
          finalTotal,
          deliveryMethod: dto.deliveryMethod,
          status: OrderStatus.SEDANG_DIKEMAS,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtBuy: item.product.price, 
            })),
          },
          statusHistory: {
            create: { status: OrderStatus.SEDANG_DIKEMAS },
          },
        },
      });

      await prisma.walletTransaction.create({
        data: {
          userId: buyerId,
          amount: finalTotal,
          type: TransactionType.PAYMENT,
          description: `Pembayaran Pesanan #${order.id.slice(-6).toUpperCase()}`,
        },
      });

      for (const item of cartItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await prisma.cartItem.deleteMany({ where: { userId: buyerId } });

      return { message: 'Checkout berhasil!', orderId: order.id, finalTotal };
    });
  }

  // =====================================
  // 2. RIWAYAT PESANAN PEMBELI (BUYER)
  // =====================================
  // =====================================
  // 2. RIWAYAT PESANAN PEMBELI (BUYER)
  // =====================================
  async getBuyerOrders(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: {
        store: { select: { name: true } },
        address: true, 
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =====================================
  // 3. PESANAN MASUK TOKO (SELLER)
  // =====================================
  async getStoreOrders(sellerId: string) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: sellerId } });
    if (!store) return [];

    return this.prisma.order.findMany({
      where: { storeId: store.id },
      include: {
        buyer: { select: { fullName: true, username: true } },
        address: true,
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =====================================
  // 4. SELLER: PROSES PESANAN MASUK
  // =====================================
  async processOrder(sellerId: string, orderId: string) {
    // 1. Cari pesanan dan sertakan data toko untuk mengecek kepemilikan
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    // 2. Validasi Keamanan & Status
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan.');
    if (order.store.ownerId !== sellerId) {
      throw new ForbiddenException('Akses ditolak. Anda bukan pemilik toko ini.');
    }
    if (order.status !== OrderStatus.SEDANG_DIKEMAS) {
      throw new BadRequestException('Pesanan ini sudah diproses atau dibatalkan.');
    }

    // 3. Perbarui Status dan Catat Riwayat Waktu (Nested Writes)
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.MENUNGGU_PENGIRIM,
        statusHistory: {
          create: { status: OrderStatus.MENUNGGU_PENGIRIM },
        },
      },
    });
  }
  // =====================================
  // 5. LAPORAN FINANSIAL (LEVEL 4)
  // =====================================
  async getBuyerReport(buyerId: string) {
    const orders = await this.prisma.order.findMany({ where: { buyerId } });
    
    const totalPengeluaran = orders.reduce((sum, order) => sum + order.finalTotal, 0);
    return { totalOrders: orders.length, totalPengeluaran };
  }

  async getSellerReport(sellerId: string) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: sellerId } });
    if (!store) return { totalOrders: 0, totalPendapatan: 0 };

    const orders = await this.prisma.order.findMany({ where: { storeId: store.id } });
    
    // Logika Bisnis: Pendapatan toko = subtotal (harga murni barang). PPN dan Ongkir bukan hak toko.
    const totalPendapatan = orders.reduce((sum, order) => sum + order.subtotal, 0);
    return { totalOrders: orders.length, totalPendapatan };
  }
}