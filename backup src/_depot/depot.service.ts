/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AddDepotDto } from './dto/addDepot.dto';

@Injectable()
export class DepotService {
    constructor(private readonly prisma: PrismaService) {}
    

    async createDepot(companyId: string, data: AddDepotDto) {
    try {
      const result = await this.prisma.withTenant(companyId, async (tx) => {
        
        const newDepot = await tx.depot.create({
          data: {
            name: data.name,           
            address: data.address,   
            lat: data.lat,           
            lng: data.lng,            
            companyId: companyId,    
          },
        });

        return {
          status: 'success',
          message: 'Depot / Cabang baru berhasil didaftarkan',
          data: newDepot,
        };

      });

      return result;
      
    } catch (error) {
      console.error('Error creating depot:', error);
      throw new Error('Gagal membuat depot baru');
    }
}

    async getAllDepots(companyId: string) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        
        const depots = await tx.depot.findMany({
          where: { 
            companyId: companyId 
          },
          orderBy: {
            name: 'asc' 
          }
        });

        return {
          status: 'success',
          message: 'Berhasil mengambil data depot',
          data: depots,
        };
        
      });
    } catch (error) {
      console.error('ERROR GET DEPOTS:', error);
      throw new InternalServerErrorException('Terjadi kesalahan saat mengambil data depot.');
    }
  }

  // buat tes rls aja
  // async getAllDepots(companyId: string) {
  //   try {
  //     return await this.prisma.withTenant(companyId, async (tx) => {
        
  //       // Sengaja HAPUS filter 'where: { companyId }' untuk ngetes RLS
  //       // Setara dengan: SELECT * FROM "Depot" ORDER BY "name" ASC;
  //       const depots = await tx.depot.findMany({
  //         orderBy: {
  //           name: 'asc' 
  //         }
  //       });

  //       // Tampilkan hasilnya di terminal backend (NestJS)
  //       console.log('--- TEST RLS DEPOT ---');
  //       console.log(`Company ID dari Token : ${companyId}`);
  //       console.log(`Jumlah Depot Didapat  : ${depots.length}`);
  //       console.log('Data Detail           :', JSON.stringify(depots, null, 2));
  //       console.log('----------------------');

  //       return {
  //         status: 'success',
  //         message: 'Berhasil mengambil data depot',
  //         data: depots,
  //       };
        
  //     });
  //   } catch (error) {
  //     console.error('ERROR GET DEPOTS:', error);
  //     throw new InternalServerErrorException('Terjadi kesalahan saat mengambil data depot.');
  //   }
  // }

    async getDepotById(companyId: string, depotId: string) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        // cari data depot dan relasinya juga
        const depot = await tx.depot.findUnique({
          where: { 
            id: depotId 
          },
          include: {
            users: true,      // Mengambil daftar admin/driver di depot ini
            orders: true,     // Mengambil daftar order dari depot ini
            packages: true,   // Mengambil daftar paket di depot ini
            routes: true,      // Mengambil daftar rute yang bermula dari depot ini
            products: {
              include: {
                images: {
                  orderBy: [
                    { isMain: 'desc' }, // isMain: true akan berada di urutan paling atas
                    { order: 'asc' },   // Sisanya diurutkan sesuai nomor urut
                  ],
                },
              },
            }
          }
        });

        if (!depot) {
          throw new NotFoundException('Depot tidak ditemukan atau Anda tidak memiliki akses.');
        }

        return {
          status: 'success',
          message: 'Berhasil mengambil detail depot beserta relasinya',
          data: depot,
        };
        
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('ERROR GET DEPOT BY ID:', error);
      throw new InternalServerErrorException('Terjadi kesalahan saat mengambil detail depot.');
    }
  }

  async testGetAllProductsRLS(companyId: string) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        
        // Sengaja TIDAK ADA filter 'where: { companyId }' untuk ngetes RLS
        // Setara dengan: SELECT * FROM "Product";
        const products = await tx.product.findMany({
          // Include ditambahkan agar kita bisa melihat datanya utuh (opsional)
          include: {
            images: true,
          },
          orderBy: {
            createdAt: 'desc' 
          }
        });

        // Tampilkan hasilnya di terminal backend (NestJS)
        console.log('--- TEST RLS PRODUCT ---');
        console.log(`Company ID dari Token : ${companyId}`);
        console.log(`Jumlah Produk Didapat : ${products.length}`);
        console.log('Data Detail           :', JSON.stringify(products, null, 2));
        console.log('------------------------');

        return {
          status: 'success',
          message: 'Berhasil test RLS Product',
          data: products,
        };
        
      });
    } catch (error) {
      console.error('ERROR TEST RLS PRODUCTS:', error);
      throw new InternalServerErrorException('Terjadi kesalahan saat test RLS produk.');
    }
  }

  async updateDepot(companyId: string, id: string, dto: AddDepotDto) {
  try {
    return await this.prisma.withTenant(companyId, async (tx) => {
      
      // 1. Cari depot dan pastikan milik companyId yang benar di dalam tenant context
      const depot = await tx.depot.findFirst({
        where: {
          id: id,
          companyId: companyId,
        },
      });

      if (!depot) {
        throw new NotFoundException(`Depot dengan ID ${id} tidak ditemukan di perusahaan Anda.`);
      }

      // 2. Lakukan update
      const updatedDepot = await tx.depot.update({
        where: { id: id },
        data: {
          name: dto.name,
          address: dto.address,
          lat: dto.lat,
          lng: dto.lng,
        },
      });

      return {
        status: 'success',
        message: 'Data depot berhasil diperbarui',
        data: updatedDepot,
      };
    });
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    console.error('ERROR UPDATE DEPOT:', error);
    throw new InternalServerErrorException('Terjadi kesalahan saat memperbarui data depot.');
  }
}

  // async customerGetAllDepot(companyId: string) {
  //   try {
  //     return await this.prisma.withTenant(companyId, async (tx) => {
  //       const products = await tx.product.findMany({
  //         // Include ditambahkan agar kita bisa melihat datanya utuh (opsional)
  //         include: {
  //           images: true,
  //         },
  //         orderBy: {
  //           createdAt: 'desc' 
  //         }
  //       });
        
  //     });
  //   } catch (error) {
  //     console.error('ERROR CUSTOMER GET ALL DEPOT:', error);
  //     throw new InternalServerErrorException('Terjadi kesalahan saat mengambil daftar depot.');
  //   }
  // }
}
