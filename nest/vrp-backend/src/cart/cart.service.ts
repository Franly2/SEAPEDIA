/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { AddToCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Lihat Keranjang
  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { store: true } // Tarik data produk dan tokonya
        }
      },
      orderBy: { id: 'asc' }
    });

    // Hitung subtotal dinamis
    const subtotal = items.reduce((total, item) => total + (item.quantity * item.product.price), 0);
    // Karena single-store, nama toko bisa diambil dari item pertama (jika ada)
    const storeName = items.length > 0 ? items[0].product.store.name : null;

    return { storeName, subtotal, items };
  }

  // 2. Tambah ke Keranjang (SINGLE-STORE RULE & STOCK CHECK)
  async addToCart(userId: string, dto: AddToCartDto) {
    const targetProduct = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!targetProduct) throw new NotFoundException('Produk tidak ditemukan.');
    if (targetProduct.stock < dto.quantity) throw new BadRequestException('Stok produk tidak mencukupi.');

    // Cek isi keranjang saat ini
    const existingCart = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (existingCart.length > 0) {
      const currentStoreId = existingCart[0].product.storeId;
      // ATURAN SINGLE-STORE: Jika toko berbeda, tolak mentah-mentah!
      if (currentStoreId !== targetProduct.storeId) {
        throw new ConflictException({
          message: 'Keranjangmu berisi produk dari toko lain.',
          code: 'SINGLE_STORE_VIOLATION' // Kode khusus untuk dibaca frontend
        });
      }
    }

    // Jika toko sama (atau keranjang kosong), cek apakah produk sudah ada di keranjang
    const existingItem = existingCart.find(item => item.productId === dto.productId);

    if (existingItem) {
      // Jika sudah ada, tambahkan jumlahnya (cek stok gabungan)
      const newQuantity = existingItem.quantity + dto.quantity;
      if (targetProduct.stock < newQuantity) throw new BadRequestException('Stok tidak mencukupi untuk penambahan ini.');

      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    }

    // Jika belum ada, buat entri baru
    return this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });
  }

  // 3. Ubah Jumlah (Update Quantity)
  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true }
    });

    if (!item) throw new NotFoundException('Item keranjang tidak ditemukan.');
    if (item.userId !== userId) throw new ForbiddenException('Akses ditolak.');
    if (item.product.stock < quantity) throw new BadRequestException('Stok produk tidak mencukupi.');

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  // 4. Hapus Satu Barang
  async removeCartItem(userId: string, cartItemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item) throw new NotFoundException('Item keranjang tidak ditemukan.');
    if (item.userId !== userId) throw new ForbiddenException('Akses ditolak.');

    await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    return { message: 'Item dihapus dari keranjang.' };
  }

  // 5. Bersihkan Keranjang (Dibutuhkan untuk aksi "Ganti Toko" di Frontend)
  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return { message: 'Keranjang berhasil dikosongkan.' };
  }
}