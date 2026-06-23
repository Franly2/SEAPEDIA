/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  // time travel & overdue
  @Post('simulate-day')
  async simulateNextDay() {
    return this.adminService.simulateNextDay();
  }

  @Post('trigger-overdue')
  async triggerOverdueHandling() {
    return this.adminService.triggerOverdueHandling();
  }
}