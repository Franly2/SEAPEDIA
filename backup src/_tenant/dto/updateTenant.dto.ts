/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsUrl, Matches, IsNotEmpty } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama perusahaan tidak boleh kosong jika ingin diubah' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Industri perusahaan tidak boleh kosong jika ingin diubah' })
  industry?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'URL Logo tidak boleh kosong' })
  @IsUrl({}, { message: 'Format URL Logo tidak valid (harus diawali http/https)' })
  logoUrl?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Warna Utama (colorPrimary) harus berupa format Hex Color (contoh: #1976D2)',
  })
  colorPrimary?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Warna Sekunder (colorSecondary) harus berupa format Hex Color',
  })
  colorSecondary?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Warna Tersier (colorTertiary) harus berupa format Hex Color',
  })
  colorTertiary?: string;
}