/* eslint-disable prettier/prettier */
import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { VrpService } from './vrp.service';
import { ClusterRequest } from './dto/cluster.dto';

@Controller('vrp')
export class VrpController {
  constructor(private readonly vrpService: VrpService) {}

  @Post('optimize')
  async optimize(@Body() body: { courierLat: number; courierLng: number }) {
    // panggil service untuk generate rute
    return await this.vrpService.getOptimizedRoute(body.courierLat, body.courierLng);
  }

  @Post('cluster')
    @HttpCode(HttpStatus.OK) // Set status response 
    async clusterPackages(@Body() payload: ClusterRequest) {
      return await this.vrpService.cluster(payload);
    }

    @Get('test-payload')
    async getTestPayload() {
      return await this.vrpService.generateTestPayload();
    }
  
}