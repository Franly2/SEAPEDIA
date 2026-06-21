/* eslint-disable prettier/prettier */
import { IsString, IsInt, Min, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsInt()
  @Min(1)
  discountValue!: number;

  @IsDateString()
  expiryDate!: string;

  @IsInt()
  @Min(1)
  usageQuota!: number;
}

export class CreatePromoDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsInt()
  @Min(1)
  discountValue!: number;

  @IsDateString()
  expiryDate!: string;
}

export class ValidateDiscountDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}