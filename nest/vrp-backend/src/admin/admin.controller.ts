/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Body, Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

import { CreateVoucherDto } from './dto/create-voucher.dto';
import { CreatePromoDto } from './dto/create-promo.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Middleware internal untuk memastikan hanya Admin yang bisa mengakses rute ini
  private checkAdminRole(userPayload: any) {
    if (!userPayload.roles || !userPayload.roles.includes('ADMIN')) {
      throw new ForbiddenException('Akses ditolak. Rute ini hanya untuk Administrator.');
    }
  }

  @Get('dashboard')
  async getDashboardStats(@GetUser() userPayload: any) {
    this.checkAdminRole(userPayload);
    return this.adminService.getDashboardStats();
  }

  @Get('vouchers')
  async getVouchers(@GetUser() userPayload: any) {
    this.checkAdminRole(userPayload);
    return this.adminService.getVouchers();
  }

  @Post('vouchers')
  async createVoucher(@GetUser() userPayload: any, @Body() dto: CreateVoucherDto) {
    this.checkAdminRole(userPayload);
    return this.adminService.createVoucher(dto);
  }

  @Get('promos')
  async getPromos(@GetUser() userPayload: any) {
    this.checkAdminRole(userPayload);
    return this.adminService.getPromos();
  }

  @Post('promos')
  async createPromo(@GetUser() userPayload: any, @Body() dto: CreatePromoDto) {
    this.checkAdminRole(userPayload);
    return this.adminService.createPromo(dto);
  }

  // ==========================================
  // BARU: API MESIN WAKTU DAN OVERDUE ENGINE
  // ==========================================

  @Post('simulate-day')
  async simulateNextDay(@GetUser() userPayload: any) {
    this.checkAdminRole(userPayload);
    return this.adminService.simulateNextDay();
  }

  @Post('trigger-overdue')
  async triggerOverdueHandling(@GetUser() userPayload: any) {
    this.checkAdminRole(userPayload);
    return this.adminService.triggerOverdueHandling();
  }
}