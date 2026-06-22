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
  expiryDate!: string; // Akan menerima format ISO 8601, contoh: "2026-12-31T23:59:59Z"
}