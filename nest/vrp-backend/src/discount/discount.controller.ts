/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateVoucherDto, CreatePromoDto, ValidateDiscountDto } from './dto/discount.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('discount')
@UseGuards(JwtAuthGuard) // Melindungi semua rute agar hanya pengguna terdaftar yang bisa mengakses
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  // POST /discount/voucher (Idealnya ini dilindungi RoleGuard khusus ADMIN)
  @Post('voucher')
  async createVoucher(@Body() dto: CreateVoucherDto) {
    return this.discountService.createVoucher(dto);
  }

  // POST /discount/promo (Idealnya ini dilindungi RoleGuard khusus ADMIN)
  @Post('promo')
  async createPromo(@Body() dto: CreatePromoDto) {
    return this.discountService.createPromo(dto);
  }

  // GET /discount -> Melihat daftar semua diskon yang ada
  @Get()
  async getAllDiscounts() {
    return this.discountService.getAllDiscounts();
  }

  // POST /discount/validate -> Dipanggil oleh Buyer saat memasukkan kode di halaman Checkout
  @Post('validate')
  async validateCode(@Body() dto: ValidateDiscountDto) {
    return this.discountService.validateCode(dto.code);
  }
}