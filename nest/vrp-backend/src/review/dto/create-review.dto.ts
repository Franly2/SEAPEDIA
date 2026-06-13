/* eslint-disable prettier/prettier */
import { IsString, IsInt, Min, Max, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama reviewer tidak boleh kosong' })
  reviewerName!: string;

  @IsInt()
  @Min(1, { message: 'Rating minimal 1 bintang' })
  @Max(5, { message: 'Rating maksimal 5 bintang' })
  rating!: number;

  @IsString()
  @IsNotEmpty({ message: 'Komentar tidak boleh kosong' })
  comment!: string;

  // Opsional: Hanya diisi jika user sedang login
  @IsOptional()
  @IsString()
  userId?: string; 
}