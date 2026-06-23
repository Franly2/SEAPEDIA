/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; 
import { Roles } from '../auth/decorators/roles.decorator'; 
import { Role } from '@prisma/client'; 
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BUYER)
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

  @Delete('clear') 
  async clearCart(@GetUser('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Delete(':id')
  async removeCartItem(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.cartService.removeCartItem(userId, id);
  }
}