/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { VehicleType } from '@prisma/client';
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsUUID, 
  IsDateString, 
  Min, 
  Length, 
  IsEnum,
  MinLength
} from 'class-validator';

export class addDriverDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;


  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phoneNumber: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: string; 


  @IsUUID()
  @IsNotEmpty()
  depotId: string; 




  // --- Data Kendaraan ---
  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @IsString()
  @IsNotEmpty()
  @Length(3, 15)
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string; 

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  maxWeight: number; 

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  maxVolume: number; 
}