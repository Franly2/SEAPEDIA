/* eslint-disable prettier/prettier */


  // src/product/product.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // =========================================
  // RUTE PRIVAT SELLER (Wajib Token)
  // =========================================

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(@GetUser('userId') userId: string, @Body() dto: CreateProductDto) {
    return this.productService.createSellerProduct(userId, dto);
  }

  // PENTING: Harus diletakkan sebelum /:id
  @UseGuards(JwtAuthGuard)
  @Get('my-products')
  async getMyProducts(@GetUser('userId') userId: string) {
    return this.productService.findMyProducts(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateProduct(
    @GetUser('userId') userId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productService.updateSellerProduct(userId, productId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteProduct(
    @GetUser('userId') userId: string,
    @Param('id') productId: string
  ) {
    return this.productService.deleteSellerProduct(userId, productId);
  }

  // =========================================
  // RUTE PUBLIK (Tanpa Token - Level 1)
  // =========================================

  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
