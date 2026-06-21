/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscountController],
  providers: [DiscountService],
})
export class DiscountModule {}