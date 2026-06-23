/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateVoucherDto, CreatePromoDto, ValidateDiscountDto } from './dto/discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('discount')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post('voucher')
  @Roles(Role.ADMIN)
  async createVoucher(@Body() dto: CreateVoucherDto) {
    return this.discountService.createVoucher(dto);
  }

  @Post('promo')
  @Roles(Role.ADMIN)
  async createPromo(@Body() dto: CreatePromoDto) {
    return this.discountService.createPromo(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async getAllDiscounts() {
    return this.discountService.getAllDiscounts();
  }

  @Post('validate')
  @Roles(Role.BUYER)
  async validateCode(@Body() dto: ValidateDiscountDto) {
    return this.discountService.validateCode(dto.code);
  }
}