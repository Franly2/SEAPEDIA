/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@GetUser('userId') userId: string, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(userId, dto);
  }

  @Get('my-orders') // Untuk Buyer
  async getMyOrders(@GetUser('userId') userId: string) {
    return this.ordersService.getBuyerOrders(userId);
  }

  @Get('store-orders') // Untuk Seller
  async getStoreOrders(@GetUser('userId') userId: string) {
    return this.ordersService.getStoreOrders(userId);
  }

  // === BARU LEVEL 4: API PROSES PESANAN UNTUK SELLER ===
  @Put(':id/process')
  async processOrder(
    @GetUser('userId') sellerId: string, 
    @Param('id') orderId: string
  ) {
    return this.ordersService.processOrder(sellerId, orderId);
  }

  // === BARU LEVEL 4: API LAPORAN FINANSIAL ===
  @Get('report/buyer')
  async getBuyerReport(@GetUser('userId') userId: string) {
    return this.ordersService.getBuyerReport(userId);
  }

  @Get('report/seller')
  async getSellerReport(@GetUser('userId') userId: string) {
    return this.ordersService.getSellerReport(userId);
  }
}