/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@GetUser('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post()
  async addToCart(@GetUser('userId') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(userId, dto);
  }

  @Put(':id')
  async updateQuantity(
    @GetUser('userId') userId: string, 
    @Param('id') id: string, 
    @Body() dto: UpdateCartDto
  ) {
    return this.cartService.updateQuantity(userId, id, dto.quantity);
  }

  @Delete('clear') // Harus ditaruh di atas rute ':id' agar tidak dianggap parameter ID
  async clearCart(@GetUser('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Delete(':id')
  async removeCartItem(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.cartService.removeCartItem(userId, id);
  }
}