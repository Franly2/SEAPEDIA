/* eslint-disable prettier/prettier */
// src/address/address.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('addresses')
@UseGuards(JwtAuthGuard) // Wajib login
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  async create(@GetUser('userId') userId: string, @Body() dto: CreateAddressDto) {
    return this.addressService.create(userId, dto);
  }

  @Get()
  async findAll(@GetUser('userId') userId: string) {
    return this.addressService.findAllByUser(userId);
  }

  @Put(':id')
  async update(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.addressService.remove(userId, id);
  }
}