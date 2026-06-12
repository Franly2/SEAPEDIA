/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { VrpService } from './vrp.service';
import { VrpController } from './vrp.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports : [PrismaModule],
  providers: [VrpService],
  controllers: [VrpController]
})
export class VrpModule {}
