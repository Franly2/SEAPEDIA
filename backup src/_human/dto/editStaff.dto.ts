/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class EditStaffDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong jika ingin diubah' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  phoneNumber?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal lahir tidak valid' })
  @IsNotEmpty({ message: 'Tanggal lahir tidak boleh kosong' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'ID Depot tidak boleh kosong' })
  depotId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong jika ingin diubah' })
  password?: string;

  // --- Field Khusus Driver (Tabel Vehicle) ---
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  vehicleType?: 'MOTOR' | 'MOBIL';

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Plat nomor tidak boleh kosong' })
  plateNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Model kendaraan tidak boleh kosong' })
  vehicleModel?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Maks beban harus berupa angka' })
  maxWeight?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Maks volume harus berupa angka' })
  maxVolume?: number;
}