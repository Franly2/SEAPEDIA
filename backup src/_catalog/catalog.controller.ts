/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddProductDto } from 'src/_catalog/dto/addProduct.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { ProductStatus } from '@prisma/client';
import { addShiftDto } from './dto/addShift.dto';

@UseGuards(JwtAuthGuard )
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('product')
    async createProduct(
      @Body() dto: AddProductDto,
      @GetUser('companyId') companyId: string,
      @GetUser('role') role: string
    ) {
      if (role !== 'OWNER' && role !== 'ADMIN') {
        throw new ForbiddenException('Hanya Owner atau Admin yang boleh menambah produk.');
      }

      return await this.catalogService.createProduct(companyId, role, dto);
    }

    @Post('shift')
    async addShift(
      @Body() dto: addShiftDto,
      @GetUser('companyId') companyId: string,
      @GetUser('role') role: string
    ) {
      if (role !== 'OWNER' && role !== 'ADMIN') {
        throw new ForbiddenException('Hanya Owner atau Admin yang boleh menambah shift pengiriman.');
      }

      return await this.catalogService.createShift(companyId, dto);
    }

    @Get('shifts')
    async getAllShifts(@GetUser('companyId') companyId: string) {
      return await this.catalogService.getAllShifts(companyId);
    }

  @Patch('/:id/status')
    async changeProductStatus(
      @Param('id') productId: string,
      @GetUser('companyId') companyId: string,
      @GetUser('role') role: string,
      @Body('status') newStatus: ProductStatus,
    ) {
      if (role !== 'OWNER' && role !== 'ADMIN') {
        throw new ForbiddenException('Hanya Owner atau Admin yang boleh mengubah status produk.');
      } 
      return await this.catalogService.changeProductStatus(companyId,productId, newStatus, role);
    }

  @Get(':id')
  async getProduct(
    @Param('id') productId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return await this.catalogService.getProductById(companyId, productId);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') productId: string,
    @GetUser('companyId') companyId: string,
    @Body() dto: AddProductDto,
  ) {
    return await this.catalogService.updateProduct(companyId, productId, dto);
  }


  //getAllProducts (untuk customer, hanya produk dengan status ACTIVE yang ditampilkan)

  //getDepotProducts (ambil semua produk yang tersedia di depot tertentu, hanya produk dengan status ACTIVE yang ditampilkan)
}
