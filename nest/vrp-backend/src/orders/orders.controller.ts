/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @Roles(Role.BUYER)
  async checkout(@GetUser('userId') userId: string, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(userId, dto);
  }

  @Get('my-orders') 
  @Roles(Role.BUYER)
  async getMyOrders(@GetUser('userId') userId: string) {
    return this.ordersService.getBuyerOrders(userId);
  }

  @Get('store-orders') 
  @Roles(Role.SELLER)
  async getStoreOrders(@GetUser('userId') userId: string) {
    return this.ordersService.getStoreOrders(userId);
  }

  @Put(':id/process')
  @Roles(Role.SELLER)
  async processOrder(
    @GetUser('userId') sellerId: string, 
    @Param('id') orderId: string
  ) {
    return this.ordersService.processOrder(sellerId, orderId);
  }

  @Get('report/buyer')
  @Roles(Role.BUYER)
  async getBuyerReport(@GetUser('userId') userId: string) {
    return this.ordersService.getBuyerReport(userId);
  }

  @Get('report/seller')
  @Roles(Role.SELLER)
  async getSellerReport(@GetUser('userId') userId: string) {
    return this.ordersService.getSellerReport(userId);
  }
}