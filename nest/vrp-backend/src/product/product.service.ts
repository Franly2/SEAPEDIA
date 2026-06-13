/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';


@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // Mengambil semua produk yang ada di database untuk halaman katalog publik
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Produk terbaru muncul di awal
      },
    });
  }

  // Mengambil satu produk spesifik berdasarkan ID untuk halaman detail produk
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produk dengan ID ${id} tidak ditemukan.`);
    }

    return product;
  }

  private async getStoreIdByUserId(userId: string): Promise<string> {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!store) {
      throw new ForbiddenException('Akses ditolak. Anda belum memiliki toko.');
    }
    return store.id;
  }

  // 1. Membuat produk baru
  async createSellerProduct(userId: string, dto: CreateProductDto) {
    const storeId = await this.getStoreIdByUserId(userId);
    
    return this.prisma.product.create({
      data: {
        ...dto,
        storeId: storeId, // Paksa ID toko milik user, bukan dari body input
      },
    });
  }

  // 2. Mengambil daftar produk khusus milik toko si Penjual
  async findMyProducts(userId: string) {
    const storeId = await this.getStoreIdByUserId(userId);
    
    return this.prisma.product.findMany({
      where: { storeId: storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Mengedit produk (Validasi kepemilikan)
  async updateSellerProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const storeId = await this.getStoreIdByUserId(userId);
    
    // Cek apakah produk ada dan apakah storeId produk tersebut sama dengan storeId milik user
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }
    if (existingProduct.storeId !== storeId) {
      throw new ForbiddenException('Anda tidak berhak mengubah produk dari toko lain.');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });
  }

  // 4. Menghapus produk (Validasi kepemilikan)
  async deleteSellerProduct(userId: string, productId: string) {
    const storeId = await this.getStoreIdByUserId(userId);
    
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      throw new NotFoundException('Produk tidak ditemukan.');
    }
    if (existingProduct.storeId !== storeId) {
      throw new ForbiddenException('Anda tidak berhak menghapus produk dari toko lain.');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Produk berhasil dihapus.' };
  }
}