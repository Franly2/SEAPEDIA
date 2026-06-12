/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { HumanService } from './human.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddAdminDto } from './dto/addAdmin.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { addDriverDto } from './dto/addDriver.dto';
import { ChangeStatusDto } from './dto/changeStatus.dto';
import { EditStaffDto } from './dto/editStaff.dto';

@UseGuards(JwtAuthGuard )
@Controller('human')
export class HumanController {
  constructor(private readonly humanService: HumanService) {}

  @Post('admin')
    async createAdmin(
        @Body() dto: AddAdminDto,
        @GetUser('companyId') companyId: string,
        @GetUser('role') role: string
    ) {
    if (role !== 'OWNER') {
      throw new ForbiddenException('Akses ditolak! Hanya Owner yang bisa menambah Admin Cabang/Depot.');
    }

    return await this.humanService.createAdmin(companyId, dto);
    }

    @Post('driver')
    async createDriver(
        @Body() dto: addDriverDto,
        @GetUser('companyId') companyId: string,
        @GetUser('role') role: string
    ) {
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('Akses ditolak! Hanya Owner atau Admin yang bisa menambah Driver Cabang/Depot.');
    }

    return await this.humanService.createDriver(dto, role,companyId );
    }

    @Post('accept-driver')
    async acceptDriver(
        @GetUser('companyId') companyId: string,
        @Body('userId') driverId: string,
        @GetUser('role') role: string
    ) {
        if (role !== 'OWNER') {
            throw new ForbiddenException('Akses ditolak! Hanya Owner yang bisa menerima Driver.');
        }

        return await this.humanService.acceptDriver(companyId, driverId);
    }

    @Patch('status-employee') 
    async changeStatusEmployee(
        @GetUser('companyId') companyId: string,
        @Body() dto: ChangeStatusDto, 
        @GetUser('role') role: string
    ) {
        if (role !== 'OWNER') {
            throw new ForbiddenException('Akses ditolak! Hanya Owner yang bisa mengubah status karyawan.');
        }       
        return await this.humanService.changeStatusEmployee(companyId, dto.userId, dto.status);
    }

    @Get(':id')
    async getStaffById(
        @Param('id') staffId: string,
        @GetUser('companyId') companyId: string,
        @GetUser('role') role: string
    ) {
        if (role !== 'OWNER' && role !== 'ADMIN') {
            throw new ForbiddenException('Akses ditolak! Hanya Owner dan Admin yang bisa melihat data staf.');
        }

        return await this.humanService.getStaffById(staffId, companyId);
    }

    @Put(':id')
    async editStaff(
        @Param('id') staffId: string,
        @Body() dto: EditStaffDto,
        @GetUser('companyId') companyId: string,
        @GetUser('role') role: string,
    ) {
        if (role !== 'OWNER' && role !== 'ADMIN') {
        throw new ForbiddenException('Akses ditolak! Hanya Owner dan Admin yang bisa mengedit data staf.');
        }

        return await this.humanService.editStaff(companyId, staffId, dto);
    }
}
