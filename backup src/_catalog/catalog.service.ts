/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AddProductDto } from './dto/addProduct.dto';
import { ProductStatus } from '@prisma/client';
import { addShiftDto } from './dto/addShift.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // async createProduct(companyId: string, role: string,  data: AddProductDto) {
  //   try {
  //     return await this.prisma.withTenant(companyId, async (tx) => {
        
  //       const existingProduct = await tx.product.findFirst({
  //         where: {
  //           name: {
  //             equals: data.name,
  //             mode: 'insensitive',
  //           },
  //           companyId: companyId, 
  //         },
  //       });

  //       if (existingProduct) {
  //         throw new BadRequestException(`Produk dengan nama '${data.name}' sudah ada di katalog Anda.`);
  //       }

  //       let initialStatus: ProductStatus = ProductStatus.PENDING;
  
  //       if (role === 'OWNER') {
  //         initialStatus = ProductStatus.UNAVAILABLE;
  //       }

  //       const newProduct = await tx.product.create({
  //         data: {
  //           name: data.name,
  //           price: data.price,
  //           weightEst: data.weightEst,
  //           volumeEst: data.volumeEst,
  //           isSubscription: data.isSubscription ?? false,
  //           durationDays: data.durationDays,
  //           companyId: companyId, 
  //           status: initialStatus,
  //           availableAt: {
  //             connect: data.depotIds?.map((id) => ({ id })) || [],
  //           },
  //         },
  //         include: {
  //           availableAt: true 
  //         }
  //       });

  //       return {
  //         status: 'success',
  //         message: 'Produk berhasil ditambahkan dan tersedia di depot terkait.',
  //         data: newProduct,
  //       };
        
  //     });
  //   } catch (error) {
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
      
  //     console.error('ERROR CREATE PRODUCT:', error);
  //     throw new InternalServerErrorException('Gagal menambahkan produk.');
  //   }
  // }

  async createProduct(companyId: string, role: string,  data: AddProductDto) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        
        const existingProduct = await tx.product.findFirst({
          where: {
            name: {
              equals: data.name,
              mode: 'insensitive',
            },
            companyId: companyId, 
          },
        });

        if (existingProduct) {
          throw new BadRequestException(`Produk dengan nama '${data.name}' sudah ada di katalog Anda.`);
        }

        let initialStatus: ProductStatus = ProductStatus.PENDING;
  
        if (role === 'OWNER') {
          initialStatus = ProductStatus.UNAVAILABLE;
        }

        const newProduct = await tx.product.create({
          data: {
            name: data.name,
            price: data.price,
            weightEst: data.weightEst,
            volumeEst: data.volumeEst,
            isSubscription: data.isSubscription ?? false,
            // Pastikan durationDays hanya diisi jika isSubscription true
            durationDays: data.isSubscription ? data.durationDays : null,
            companyId: companyId, 
            status: initialStatus,
            availableAt: {
              connect: data.depotIds?.map((id) => ({ id })) || [],
            },
            // --- TAMBAHAN UPDATE: Jam Produk (Shifts), Schedules, & Images ---
            availableShifts: data.shiftIds && data.shiftIds.length > 0 
              ? { connect: data.shiftIds.map((id) => ({ id })) } 
              : undefined,
            schedules: data.schedules && data.schedules.length > 0 
              ? {
                  create: data.schedules.map((s) => ({
                    dayOfWeek: s.dayOfWeek,
                    menuDetails: s.menuDetails,
                    companyId: companyId, // Wajib disisipkan untuk RLS
                  })),
                } 
              : undefined,
            images: data.images && data.images.length > 0 
              ? {
                  create: data.images.map((img) => ({
                    url: img.url,
                    isMain: img.isMain,
                    order: img.order,
                    companyId: companyId, // Wajib disisipkan untuk RLS
                  })),
                } 
              : undefined,
          },
          include: {
            availableAt: true,
            availableShifts: true, // Sertakan jam produk di response
            schedules: true,
            images: {
              orderBy: [
                { isMain: 'desc' },
                { order: 'asc' }
              ]
            }
          }
        });

        return {
          status: 'success',
          message: 'Produk berhasil ditambahkan dan tersedia di depot terkait.',
          data: newProduct,
        };
        
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('ERROR CREATE PRODUCT:', error);
      throw new InternalServerErrorException('Gagal menambahkan produk.');
    }
  }

  async changeProductStatus(
    companyId: string, 
    productId: string, 
    newStatus: ProductStatus, 
    role: string
  ) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product || product.companyId !== companyId) {
          throw new NotFoundException('Produk tidak ditemukan.');
        }

        if (role === 'ADMIN') {
          const forbiddenForAdmin: ProductStatus[] = [ProductStatus.REJECTED];
          
          if (forbiddenForAdmin.includes(newStatus)) {
            throw new BadRequestException('Hanya Owner yang dapat menolak produk baru.');
          }
          if (product.status === ProductStatus.PENDING) {
            throw new BadRequestException('Produk masih dalam status PENDING. Tunggu persetujuan Owner.');
          }
        }

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { status: newStatus },
        });

        return {
          status: 'success',
          message: `Status produk berhasil diubah menjadi ${newStatus}`,
          data: updatedProduct,
        };
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('ERROR CHANGE STATUS:', errorMessage);
      throw new InternalServerErrorException('Gagal mengubah status produk.');
    }
  }

  async getProductById(companyId: string, productId: string) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        const product = await tx.product.findUnique({
          where: { 
            id: productId 
          },
          include: {
            // 1. Mengambil daftar depot
            availableAt: {
              select: {
                id: true,
                name: true,
                address: true,
              }
            },
            // 2. Mengambil gambar (Urut berdasarkan utama dan order)
            images: {
              orderBy: [
                { isMain: 'desc' }, 
                { order: 'asc' },   
              ],
            },
            // 3. --- TAMBAHAN: Mengambil Shift / Jam Pengiriman ---
            availableShifts: true,
            
            // 4. --- TAMBAHAN: Mengambil Jadwal Harian Katering ---
            schedules: {
              orderBy: {
                dayOfWeek: 'asc', // Otomatis mengurutkan dari Senin (1) ke Minggu (7)
              }
            },
          }
        });

        if (!product || product.companyId !== companyId) {
          throw new NotFoundException(`Produk dengan ID ${productId} tidak ditemukan.`);
        }

        return {
          status: 'success',
          message: 'Berhasil mengambil detail produk',
          data: product,
        };
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('ERROR GET PRODUCT BY ID:', errorMessage);
      throw new InternalServerErrorException('Gagal mengambil detail produk.');
    }
  }

  async createShift(companyId: string, data: addShiftDto) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        
        // Opsional: Pengecekan nama shift duplikat agar tidak ada "Pagi" dua kali
        const existingShift = await tx.deliveryShift.findFirst({
          where: {
            name: {
              equals: data.name,
              mode: 'insensitive',
            },
            companyId: companyId,
          },
        });

        if (existingShift) {
          throw new BadRequestException(`Shift dengan nama '${data.name}' sudah ada.`);
        }

        // Membuat shift baru
        const newShift = await tx.deliveryShift.create({
          data: {
            name: data.name,             // Contoh: "Shift Pagi"
            startTime: data.startTime,   // Contoh: "08:00"
            endTime: data.endTime,       // Contoh: "12:00"
            companyId: companyId,        // 👈 Wajib disisipkan untuk RLS
          },
        });

        return {
          status: 'success',
          message: 'Shift pengiriman berhasil ditambahkan.',
          data: newShift,
        };
      });
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('ERROR CREATE SHIFT:', error);
      
      // Tangkap error jika kebetulan ada constraint unik di level database
      if (error.code === 'P2002') {
        throw new BadRequestException('Shift pengiriman dengan data tersebut sudah ada (duplikat).');
      }

      throw new InternalServerErrorException('Gagal menambahkan shift pengiriman baru.');
    }
  }

  async updateProduct(companyId: string, productId: string, dto: AddProductDto) {
  try {
    return await this.prisma.withTenant(companyId, async (tx) => {
      // 1. Cek eksistensi
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || product.companyId !== companyId) {
        throw new NotFoundException('Produk tidak ditemukan.');
      }

      // 2. LOGIKA SINKRONISASI RELASI ONE-TO-MANY (Schedules & Images)
      // Kita hapus dulu yang lama, lalu nanti kita re-create yang baru dari DTO
      
      // Hapus jadwal lama jika produk ini katering
      await tx.productSchedule.deleteMany({ where: { productId } });
      
      // Hapus gambar lama (Opsional: Jika DTO mengirim daftar gambar baru secara utuh)
      if (dto.images) {
        await tx.productImage.deleteMany({ where: { productId } });
      }

      // 3. PROSES UPDATE UTAMA
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          name: dto.name,
          price: dto.price,
          weightEst: dto.weightEst,
          volumeEst: dto.volumeEst,
          isSubscription: dto.isSubscription,
          durationDays: dto.isSubscription ? dto.durationDays : null,

          // SINKRONISASI MANY-TO-MANY (Depots)
          availableAt: {
            set: dto.depotIds?.map(id => ({ id })) || [] 
          },

          // SINKRONISASI MANY-TO-MANY (Shifts/Jam Pengiriman)
          availableShifts: {
            set: dto.shiftIds?.map(id => ({ id })) || []
          },

          // RE-CREATE ONE-TO-MANY (Schedules)
          schedules: dto.schedules && dto.isSubscription ? {
            create: dto.schedules.map(s => ({
              dayOfWeek: s.dayOfWeek,
              menuDetails: s.menuDetails,
              companyId: companyId // Penting untuk RLS
            }))
          } : undefined,

          // RE-CREATE ONE-TO-MANY (Images)
          images: dto.images ? {
            create: dto.images.map(img => ({
              url: img.url,
              isMain: img.isMain,
              order: img.order,
              companyId: companyId // Penting untuk RLS
            }))
          } : undefined,
        },
        include: { 
          availableAt: true,
          availableShifts: true,
          schedules: true,
          images: {
            orderBy: [{ isMain: 'desc' }, { order: 'asc' }]
          }
        }
      });

      return {
        status: 'success',
        message: 'Berhasil memperbarui produk dan relasinya',
        data: updated
      };
    });
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    console.error("UPDATE_PRODUCT_ERROR:", error);
    throw new InternalServerErrorException('Gagal memperbarui data produk.');
  }
}

  async getAllShifts(companyId: string) {
    try {
      return await this.prisma.withTenant(companyId, async (tx) => {
        const shifts = await tx.deliveryShift.findMany({
          where: {
            companyId: companyId,
          },
          orderBy: {
            startTime: 'asc', // Urutkan dari jam paling pagi
          },
        });

        return {
          status: 'success',
          message: 'Berhasil mengambil daftar shift.',
          data: shifts,
        };
      });
    } catch (error) {
      console.error('ERROR GET ALL SHIFTS:', error);
      throw new InternalServerErrorException('Gagal mengambil daftar shift.');
    }
  }
}