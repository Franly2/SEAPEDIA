/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Mengizinkan penggunaan PrismaService di dalam ProductService
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}