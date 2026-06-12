/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { AccountStatus } from '@prisma/client';

export class ChangeStatusDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEnum(AccountStatus, { 
    message: 'Status tidak valid! Harus PENDING, ACCEPTED, REJECTED, atau SUSPENDED' 
  })
  status: AccountStatus;
}