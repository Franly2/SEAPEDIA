/* eslint-disable prettier/prettier */
import { IsInt, Min } from 'class-validator';

export class TopUpWalletDto {
  @IsInt({ message: 'Nominal top-up harus berupa angka bulat.' })
  @Min(5000, { message: 'Minimal top-up adalah Rp 5.000.' })
  amount!: number;
}