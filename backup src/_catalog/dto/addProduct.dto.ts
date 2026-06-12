/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  Min, 
  Max, 
  IsArray, 
  ValidateNested, 
  ValidateIf, 
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';

// --- SUB DTO UNTUK JADWAL ---
export class ProductScheduleDto {
  @IsNumber()
  @Min(1)
  @Max(7) // mastiin cuma ada 7 hari
  dayOfWeek!: number;

  @IsString()
  @IsNotEmpty({ message: 'Detail menu tidak boleh kosong' })
  menuDetails!: string;
}

// --- SUB DTO UNTUK GAMBAR ---
export class ProductImageDto {
  @IsString()
  @IsUrl({}, { message: 'Format URL gambar tidak valid' })
  @IsNotEmpty()
  url!: string;

  @IsBoolean()
  isMain!: boolean;

  @IsNumber()
  @Min(0)
  order!: number;
}

// --- DTO UTAMA ---
export class AddProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama produk tidak boleh kosong' })
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  weightEst!: number; // kilogram

  @IsNumber()
  @Min(0)
  volumeEst!: number; // liter

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Minimal harus memilih 1 depot' })
  depotIds!: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional() 
  shiftIds?: string[]; //opsional

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductScheduleDto) // Wajib pakai ini agar divalidasi ke class ProductScheduleDto
  @IsOptional()
  schedules?: ProductScheduleDto[];

  // NEW: Array of Objects untuk Gambar
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];

  @IsBoolean()
  @IsOptional()
  isSubscription?: boolean;

  @ValidateIf((object) => object.isSubscription === true)
  @IsNumber()
  @Min(1, { message: 'Durasi langganan minimal 1 hari' })
  @IsNotEmpty({ message: 'Durasi hari wajib diisi jika ini adalah produk langganan' })
  durationDays?: number;
}