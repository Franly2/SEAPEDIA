/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
// src/store/store.controller.ts
import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

// Sesuaikan path import ini dengan lokasi file decorator-mu
import { GetUser } from '../auth/get-user.decorator'; 

@Controller('stores') 
@UseGuards(JwtAuthGuard) 
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // POST /stores -> Membuat toko baru
  @Post()
  async create(
    @GetUser('userId') userId: string, // <-- Jauh lebih bersih dan elegan!
    @Body() createStoreDto: CreateStoreDto
  ) {
    return this.storeService.createStore(userId, createStoreDto);
  }

  // GET /stores/my-store -> Mengambil profil toko sendiri
  @Get('my-store')
  async findMyStore(@GetUser('userId') userId: string) {
    return this.storeService.getMyStore(userId);
  }

  // PUT /stores/my-store -> Mengupdate nama toko sendiri
  @Put('my-store')
  async update(
    @GetUser('userId') userId: string, 
    @Body() updateStoreDto: UpdateStoreDto
  ) {
    return this.storeService.updateStore(userId, updateStoreDto);
  }
}