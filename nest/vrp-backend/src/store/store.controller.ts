/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  async create(
    @GetUser('userId') userId: string,
    @Body() createStoreDto: CreateStoreDto
  ) {
    return this.storeService.createStore(userId, createStoreDto);
  }

  @Get('my-store')
  async findMyStore(@GetUser('userId') userId: string) {
    return this.storeService.getMyStore(userId);
  }

  @Put('my-store')
  async update(
    @GetUser('userId') userId: string,
    @Body() updateStoreDto: UpdateStoreDto
  ) {
    return this.storeService.updateStore(userId, updateStoreDto);
  }
}