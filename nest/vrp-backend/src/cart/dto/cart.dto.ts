/* eslint-disable prettier/prettier */
import { IsInt, Min, IsString, IsNotEmpty } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}