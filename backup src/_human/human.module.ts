/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { HumanService } from './human.service';
import { HumanController } from './human.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HumanController],
  providers: [HumanService],
})
export class HumanModule {}
