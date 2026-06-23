/* eslint-disable prettier/prettier */
import { IsString, IsNumber, IsDateString, Min, IsNotEmpty } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  @Min(1)
  discountValue!: number;

  @IsNumber()
  @Min(1)
  usageQuota!: number;

  @IsDateString()
  expiryDate!: string; 
}