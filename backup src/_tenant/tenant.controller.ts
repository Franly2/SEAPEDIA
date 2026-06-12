/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Body, Controller, ForbiddenException, Get, Put, UseGuards} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import { UpdateTenantDto } from './dto/updateTenant.dto';

@UseGuards(JwtAuthGuard )
@Controller('tenant')
export class TenantController {
    constructor(private readonly tenantService: TenantService) {}

    @Get('')
    async getCompany(@GetUser('companyId') companyId: string) {
        return await this.tenantService.getTenant(companyId);
    }

    @Put('/')
    async updateTenant(
        @GetUser('companyId') companyId: string,
        @GetUser('role') role: string,
        @Body() updateTenantDto: UpdateTenantDto,
    ) {
        if (role !== 'OWNER' && role !== 'ADMIN') {
            throw new ForbiddenException('Hanya Owner atau Admin yang boleh memperbarui data tenant.');
        }
        return await this.tenantService.updateTenant(companyId, updateTenantDto);
    }
}
