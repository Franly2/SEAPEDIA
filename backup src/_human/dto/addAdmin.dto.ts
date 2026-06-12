/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class AddAdminDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsUUID()
  @IsNotEmpty()
  depotId: string; // ID Depot tempat bertugasnya

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
  
  @IsString()
  @IsNotEmpty()
  birthDate: string; // Format: YYYY-MM-DD
}