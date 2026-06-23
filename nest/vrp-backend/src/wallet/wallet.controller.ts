/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles(Role.BUYER)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getMyWallet(@GetUser('userId') userId: string) {
    return this.walletService.getWalletDetails(userId);
  }

  @Post('topup')
  async topUp(
    @GetUser('userId') userId: string,
    @Body() dto: TopUpWalletDto,
  ) {
    return this.walletService.topUp(userId, dto.amount);
  }
}