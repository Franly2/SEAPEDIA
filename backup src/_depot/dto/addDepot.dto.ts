/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class AddDepotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsString()
  @IsOptional()
  description?: string;
}