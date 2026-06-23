/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @Post()
  async createProduct(@GetUser('userId') userId: string, @Body() dto: CreateProductDto) {
    return this.productService.createSellerProduct(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @Get('my-products')
  async getMyProducts(@GetUser('userId') userId: string) {
    return this.productService.findMyProducts(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @Put(':id')
  async updateProduct(
    @GetUser('userId') userId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productService.updateSellerProduct(userId, productId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @Delete(':id')
  async deleteProduct(
    @GetUser('userId') userId: string,
    @Param('id') productId: string
  ) {
    return this.productService.deleteSellerProduct(userId, productId);
  }

  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}