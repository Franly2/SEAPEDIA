/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Label alamat wajib diisi (misal: Rumah, Kantor).' })
  label!: string;

  @IsString()
  @IsNotEmpty({ message: 'Detail alamat pengiriman wajib diisi.' })
  addressLine!: string;
}