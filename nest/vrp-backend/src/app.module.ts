/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';


import { ReviewModule } from './review/review.module';
import { ProductModule } from './product/product.module';
import { StoreModule } from './store/store.module';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { AddressModule } from './address/address.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DiscountModule } from './discount/discount.module';

@Module({
  imports: [PrismaModule,
    AuthModule,
    ReviewModule,
    ProductModule,
    StoreModule,
    UsersModule,
    WalletModule,
    AddressModule,
    CartModule,
    OrdersModule,
    DiscountModule,
    ],
  controllers: [
    AppController,
    UsersController, 
  ],
  providers: [
    AppService,
    UsersService, 
  ],
})
export class AppModule {}
