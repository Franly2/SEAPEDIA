/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('available')
  async getAvailableJobs() {
    return this.deliveryService.getAvailableJobs();
  }

  @Get('my-jobs')
  async getMyJobs(
    @GetUser('userId') driverId: string,
    @Query('status') status: 'ACTIVE' | 'COMPLETED',
  ) {
    return this.deliveryService.getMyJobs(driverId, status);
  }

  @Get('earnings')
  async getEarnings(@GetUser('userId') driverId: string) {
    return this.deliveryService.getEarnings(driverId);
  }

  @Post(':orderId/take')
  async takeJob(
    @GetUser('userId') driverId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.deliveryService.takeJob(driverId, orderId);
  }

  @Post(':orderId/complete')
  async completeJob(
    @GetUser('userId') driverId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.deliveryService.completeJob(driverId, orderId);
  }
}