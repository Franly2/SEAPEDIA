/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; 
import { Roles } from '../auth/decorators/roles.decorator'; 
import { Role } from '@prisma/client';

import { CreateVoucherDto } from './dto/create-voucher.dto';
import { CreatePromoDto } from './dto/create-promo.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) 
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users-stats')
  async getUsersDetailStats() {
    return this.adminService.getUsersDetailStats();
  }

  @Get('vouchers')
  async getVouchers() {
    return this.adminService.getVouchers();
  }

  @Post('vouchers')
  async createVoucher(@Body() dto: CreateVoucherDto) {
    return this.adminService.createVoucher(dto);
  }

  @Get('promos')
  async getPromos() {
    return this.adminService.getPromos();
  }

  @Post('promos')
  async createPromo(@Body() dto: CreatePromoDto) {
    return this.adminService.createPromo(dto);
  }

  @Post('simulate-day')
  async simulateNextDay() {
    return this.adminService.simulateNextDay();
  }

  @Post('trigger-overdue')
  async triggerOverdueHandling() {
    return this.adminService.triggerOverdueHandling();
  }

  @Get('stores-stats')
  async getStoresDetailStats() {
    return this.adminService.getStoresDetailStats();
  }

  @Get('products-stats')
  async getProductsDetailStats() {
    return this.adminService.getProductsDetailStats();
  }

  @Get('orders-stats')
  async getOrdersDetailStats(@Query('overdue') overdue: string) {
    const isOverdue = overdue === 'true';
    return this.adminService.getOrdersDetailStats(isOverdue);
  }

  @Get('deliveries-stats')
  async getDeliveriesDetailStats() {
    return this.adminService.getDeliveriesDetailStats();
  }

  @Delete('vouchers/:id')
  async deleteVoucher(@Param('id') id: string) {
    return this.adminService.deleteVoucher(id);
  }

  @Delete('promos/:id')
  async deletePromo(@Param('id') id: string) {
    return this.adminService.deletePromo(id);
  }
}