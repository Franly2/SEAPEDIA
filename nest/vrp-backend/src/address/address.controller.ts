/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; 
import { Roles } from '../auth/decorators/roles.decorator'; 
import { Role } from '@prisma/client'; 
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('addresses')
@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles(Role.BUYER)
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