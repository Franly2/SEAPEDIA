/* eslint-disable prettier/prettier */
import { 
  IsArray, 
  IsString, 
  ArrayNotEmpty, 
  ValidateNested, 
  IsNumber, 
  Min, 
  Max, 
  IsNotEmpty,
  IsNotEmptyObject
} from 'class-validator';
import { Type } from 'class-transformer';

// === SUB-DTO: Lokasi Depot/Gudang ===
export class DepotLocationDto {
  @IsNotEmpty({ message: 'Latitude depot tidak boleh kosong' })
  @IsNumber({}, { message: 'Latitude harus berupa angka' })
  @Min(-90, { message: 'Latitude minimal -90 derajat' })
  @Max(90, { message: 'Latitude maksimal 90 derajat' })
  lat: number;

  @IsNotEmpty({ message: 'Longitude depot tidak boleh kosong' })
  @IsNumber({}, { message: 'Longitude harus berupa angka' })
  @Min(-180, { message: 'Longitude minimal -180 derajat' })
  @Max(180, { message: 'Longitude maksimal 180 derajat' })
  lng: number;
}

// === MAIN DTO: Request Payload ===
export class ClusterRequest {
  @IsArray({ message: 'driverIds harus berupa array' })
  @ArrayNotEmpty({ message: 'Minimal harus ada 1 kurir yang dipilih' })
  @IsString({ each: true, message: 'Setiap ID kurir harus berupa string teks' })
  driverIds: string[];

  @IsArray({ message: 'packageIds harus berupa array' })
  @ArrayNotEmpty({ message: 'Minimal harus ada 1 paket yang dipilih' })
  @IsString({ each: true, message: 'Setiap ID paket harus berupa string teks' })
  packageIds: string[];

  @IsString({ message: 'companyId harus diisi' })
  @IsNotEmpty()
  companyId: string; 

  @IsNotEmptyObject({}, { message: 'Objek depotLocation tidak boleh kosong' })
  @ValidateNested({ message: 'Format depotLocation tidak valid' })
  @Type(() => DepotLocationDto) 
  depotLocation: DepotLocationDto;

  
}