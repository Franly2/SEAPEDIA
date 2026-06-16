/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    // 1. Ambil seluruh isi keranjang
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId: buyerId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Keranjang belanjamu kosong.');
    }

    // Karena aturan Single-Store, ID toko cukup diambil dari item pertama
    const storeId = cartItems[0].product.storeId;

    // 2. Kalkulasi Keuangan
    const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
    
    // Tarif Ongkir Dummy berdasarkan Enum
    let deliveryFee = 0;
    if (dto.deliveryMethod === DeliveryMethod.INSTANT) deliveryFee = 20000;
    else if (dto.deliveryMethod === DeliveryMethod.NEXT_DAY) deliveryFee = 15000;
    else deliveryFee = 10000; // REGULAR

    // PPN 12% sesuai regulasi soal (Subtotal + Ongkir)
    const ppnAmount = Math.round((subtotal + deliveryFee) * 0.12);
    const finalTotal = subtotal + deliveryFee + ppnAmount;

    // 3. MULAI TRANSAKSI DATABASE (ACID compliant)
    return this.prisma.$transaction(async (prisma) => {
      
      // === PERBAIKAN: GUARD CLAUSE UNTUK USER ===
      const user = await prisma.user.findUnique({ where: { id: buyerId } });
      if (!user) {
        throw new NotFoundException('Data pengguna tidak ditemukan.');
      }
      
      if (user.walletBalance < finalTotal) {
        throw new BadRequestException(`Saldo tidak mencukupi. Total tagihan: Rp ${finalTotal}`);
      }

      // === PERBAIKAN: GUARD CLAUSE UNTUK PRODUCT ===
      // Cek Stok Real-time (menghindari selisih waktu saat checkout)
      for (const item of cartItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        
        if (!product) {
          throw new NotFoundException(`Produk dengan ID ${item.productId} sudah tidak tersedia atau dihapus.`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stok ${product.name} tidak mencukupi (sisa ${product.stock}).`);
        }
      }

      // Potong Saldo Dompet
      await prisma.user.update({
        where: { id: buyerId },
        data: { walletBalance: { decrement: finalTotal } },
      });

      // Buat Pesanan, Item Pesanan, & Riwayat Status secara bersamaan (Nested Writes)
      const order = await prisma.order.create({
        data: {
          buyerId,
          storeId,
          addressId: dto.addressId,
          subtotal,
          deliveryFee,
          ppnAmount,
          finalTotal,
          deliveryMethod: dto.deliveryMethod,
          status: OrderStatus.SEDANG_DIKEMAS,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtBuy: item.product.price, // Harga terkunci!
            })),
          },
          statusHistory: {
            create: { status: OrderStatus.SEDANG_DIKEMAS },
          },
        },
      });

      // Catat Buku Besar (Ledger Wallet)
      await prisma.walletTransaction.create({
        data: {
          userId: buyerId,
          amount: finalTotal,
          type: TransactionType.PAYMENT,
          description: `Pembayaran Pesanan #${order.id.slice(-6).toUpperCase()}`,
        },
      });

      // Potong Stok Produk
      for (const item of cartItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Kosongkan Keranjang
      await prisma.cartItem.deleteMany({ where: { userId: buyerId } });

      return { message: 'Checkout berhasil!', orderId: order.id };
    });
  }

  // =====================================
  // 2. RIWAYAT PESANAN PEMBELI (BUYER)
  // =====================================
  async getBuyerOrders(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: {
        store: { select: { name: true } },
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
}