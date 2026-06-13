/* eslint-disable prettier/prettier */
// src/product/dto/create-product.dto.ts
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama produk tidak boleh kosong' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Deskripsi tidak boleh kosong' })
  description!: string;

  @IsInt()
  @Min(0, { message: 'Harga tidak boleh negatif' })
  price!: number;

  @IsInt()
  @Min(0, { message: 'Stok tidak boleh negatif' })
  stock!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}