/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';
import { UpdateTenantDto } from './dto/updateTenant.dto';

@Injectable()
export class TenantService {
    constructor(private readonly prisma: PrismaService) {}

    async getTenant(companyId: string) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        
        const company = await tx.company.findUnique({
          where: { id: companyId },
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            logoUrl: true,
            colorPrimary: true,
            colorSecondary: true,
            colorTertiary: true,
            tier: true,
          },
        });

        if (!company) {
          throw new NotFoundException('Data branding tenant tidak ditemukan.');
        }

        return {
          status: 'success',
          message: 'Data branding berhasil dimuat melalui tenant context',
          data: company,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Gagal mengambil data perusahaan.');
    }
  }

    async updateTenant(companyId: string, payload: UpdateTenantDto) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        
        const existingCompany = await tx.company.findUnique({
          where: { id: companyId },
        });

        if (!existingCompany) {
          throw new NotFoundException('Tenant tidak ditemukan.');
        }

        const updatedCompany = await tx.company.update({
          where: { id: companyId },
          data: {
            name: payload.name,
            industry: payload.industry,
            logoUrl: payload.logoUrl,
            colorPrimary: payload.colorPrimary,
            colorSecondary: payload.colorSecondary,
            colorTertiary: payload.colorTertiary,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            logoUrl: true,
            colorPrimary: true,
            colorSecondary: true,
            colorTertiary: true,
          },
        });

        return {
          status: 'success',
          message: 'Branding dan profil perusahaan berhasil diperbarui.',
          data: updatedCompany,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal memperbarui data perusahaan.');
    }
  }
}
