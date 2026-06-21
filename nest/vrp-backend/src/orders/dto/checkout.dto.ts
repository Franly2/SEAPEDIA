/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { DeliveryMethod } from '@prisma/client';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty({ message: 'Alamat pengiriman wajib dipilih.' })
  addressId!: string;

  @IsEnum(DeliveryMethod, { message: 'Metode pengiriman tidak valid.' })
  deliveryMethod!: DeliveryMethod;

  @IsOptional()
  @IsString()
  voucherId?: string;

  @IsOptional()
  @IsString()
  promoId?: string;
}