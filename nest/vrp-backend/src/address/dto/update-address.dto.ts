/* eslint-disable prettier/prettier */
// src/address/dto/update-address.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;
}