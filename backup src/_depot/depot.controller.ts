/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards, Patch } from '@nestjs/common';
import { DepotService } from './depot.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddDepotDto } from './dto/addDepot.dto';
import { GetUser } from 'src/auth/get-user.decorator';

@UseGuards(JwtAuthGuard )
@Controller('depot')
export class DepotController {
  constructor(private readonly depotService: DepotService) {}

    @UseGuards(JwtAuthGuard)
    @Post('')
    async createDepot(
    @Body() dto: AddDepotDto,
    @GetUser('companyId') companyId: string, 
    @GetUser('role') role: string         
    ) { 
        if (role !== 'OWNER') {
        throw new ForbiddenException('Hanya Owner yang diperbolehkan menambah cabang/depot baru.');
        }
        return await this.depotService.createDepot(companyId, dto);
    }


    @Get()
    async getAllDepots(
      @GetUser('companyId') companyId: string,
    ) {
      return await this.depotService.getAllDepots(companyId);
    }

    @Get(':id')
    async getDepotById(
      @Param('id') id: string,                
      @GetUser('companyId') companyId: string, 
    ) {
      return await this.depotService.getDepotById(companyId, id);
    }

    @Patch(':id')
    async updateDepot(
      @Param('id') id: string,
      @Body() dto: AddDepotDto, 
      @GetUser('companyId') companyId: string,
      @GetUser('role') role: string,
    ) {
      if (role !== 'OWNER') {
        throw new ForbiddenException('Hanya Owner yang diperbolehkan mengubah data depot.');
      }
      return await this.depotService.updateDepot(companyId, id, dto);
    }

    // untuk tes RLS testGetAllProductsRLS
    @Get('test-rls/products')
    async testGetAllProductsRLS(
      @GetUser('companyId') companyId: string,
    ) {
      return await this.depotService.testGetAllProductsRLS(companyId);
    }


    // customerGetAllDepot (ambil semua depot terdekat dari customer)
    // @Get('customer')
    // async customerGetAllDepot(
    //   @GetUser('companyId') companyId: string,
    // ) {
    //   return await this.depotService.customerGetAllDepot(companyId);
    // }


}
