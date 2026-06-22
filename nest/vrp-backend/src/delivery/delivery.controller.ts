/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // GET /delivery/available
  @Get('available')
  async getAvailableJobs() {
    return this.deliveryService.getAvailableJobs();
  }

  // GET /delivery/my-jobs?status=ACTIVE atau COMPLETED
  @Get('my-jobs')
  async getMyJobs(
    @GetUser('userId') driverId: string,
    @Query('status') status: 'ACTIVE' | 'COMPLETED',
  ) {
    return this.deliveryService.getMyJobs(driverId, status);
  }

  // GET /delivery/earnings
  @Get('earnings')
  async getEarnings(@GetUser('userId') driverId: string) {
    return this.deliveryService.getEarnings(driverId);
  }

  // POST /delivery/:orderId/take
  @Post(':orderId/take')
  async takeJob(
    @GetUser('userId') driverId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.deliveryService.takeJob(driverId, orderId);
  }

  // POST /delivery/:orderId/complete
  @Post(':orderId/complete')
  async completeJob(
    @GetUser('userId') driverId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.deliveryService.completeJob(driverId, orderId);
  }
}