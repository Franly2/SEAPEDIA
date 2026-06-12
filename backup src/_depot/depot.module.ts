/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DepotService } from './depot.service';
import { DepotController } from './depot.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
      imports: [PrismaModule],
  controllers: [DepotController],
  providers: [DepotService],
})
export class DepotModule {}
