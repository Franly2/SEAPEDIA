/* eslint-disable prettier/prettier */
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama toko tidak boleh kosong.' })
  @MinLength(3, { message: 'Nama toko minimal harus 3 karakter.' })
  name!: string;
}