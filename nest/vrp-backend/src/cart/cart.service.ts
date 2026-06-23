/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { AddToCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { store: true } 
        }
      },
      orderBy: { id: 'asc' }
    });

    const subtotal = items.reduce((total, item) => total + (item.quantity * item.product.price), 0);
    const storeName = items.length > 0 ? items[0].product.store.name : null;

    return { storeName, subtotal, items };
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const targetProduct = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!targetProduct) throw new NotFoundException('Produk tidak ditemukan.');
    if (targetProduct.stock < dto.quantity) throw new BadRequestException('Stok produk tidak mencukupi.');

    const existingCart = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (existingCart.length > 0) {
      const currentStoreId = existingCart[0].product.storeId;
      if (currentStoreId !== targetProduct.storeId) {
        throw new ConflictException({
          message: 'Keranjangmu berisi produk dari toko lain.',
          code: 'SINGLE_STORE_VIOLATION' 
        });
      }
    }

    const existingItem = existingCart.find(item => item.productId === dto.productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      if (targetProduct.stock < newQuantity) throw new BadRequestException('Stok tidak mencukupi untuk penambahan ini.');

      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });
  }

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

  async removeCartItem(userId: string, cartItemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item) throw new NotFoundException('Item keranjang tidak ditemukan.');
    if (item.userId !== userId) throw new ForbiddenException('Akses ditolak.');

    await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    return { message: 'Item dihapus dari keranjang.' };
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return { message: 'Keranjang berhasil dikosongkan.' };
  }
}