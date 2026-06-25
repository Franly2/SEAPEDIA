/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';


@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

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
        createdAt: 'desc', 
      },
    });
  }

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

  async createSellerProduct(userId: string, dto: CreateProductDto) {
    const storeId = await this.getStoreIdByUserId(userId);
    
    return this.prisma.product.create({
      data: {
        ...dto,
        storeId: storeId, 
      },
    });
  }

  async findMyProducts(userId: string) {
    const storeId = await this.getStoreIdByUserId(userId);
    
    return this.prisma.product.findMany({
      where: { storeId: storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSellerProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const storeId = await this.getStoreIdByUserId(userId);
    
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