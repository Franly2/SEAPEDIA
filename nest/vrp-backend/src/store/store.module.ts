/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { PrismaModule } from 'prisma/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService], // Diekspor jika module lain butuh validasi relasi store
})
export class StoreModule {}