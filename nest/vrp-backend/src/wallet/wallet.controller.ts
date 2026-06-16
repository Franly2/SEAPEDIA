/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard) 
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // GET /wallet -> Menampilkan saldo dan riwayat
  @Get()
  async getMyWallet(@GetUser('userId') userId: string) {
    return this.walletService.getWalletDetails(userId);
  }

  // POST /wallet/topup -> Simulasi isi saldo
  @Post('topup')
  async topUp(
    @GetUser('userId') userId: string,
    @Body() dto: TopUpWalletDto,
  ) {
    return this.walletService.topUp(userId, dto.amount);
  }
}