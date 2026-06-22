/* eslint-disable prettier/prettier */
import { IsString, IsNumber, IsDateString, Min, IsNotEmpty } from 'class-validator';

export class CreatePromoDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  @Min(1)
  discountValue!: number;

  @IsDateString()
  expiryDate!: string;
}