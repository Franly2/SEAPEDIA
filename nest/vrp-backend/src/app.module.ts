/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

//sudah dipindah
// import { VrpModule } from './_vrp/vrp.module';
// import { TenantModule } from './tenant/tenant.module';
// import { SalesController } from './sales/sales.controller';
// import { SalesService } from './sales/sales.service';
// import { SalesModule } from './sales/sales.module';
// import { DepotModule } from './depot/depot.module';
// import { HumanModule } from './human/human.module';
// import { CatalogModule } from './_catalog/catalog.module';
import { ReviewModule } from './review/review.module';
import { ProductModule } from './product/product.module';
import { StoreModule } from './store/store.module';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule,
    AuthModule,
    ReviewModule,
    ProductModule,
    StoreModule,
    UsersModule,
    // VrpModule,
    // TenantModule,
    // SalesModule,
    // DepotModule,
    // HumanModule,
    // CatalogModule,
    ],
  controllers: [
    AppController,
    UsersController, 
    // SalesController
  ],
  providers: [
    AppService,
    UsersService, 
    // SalesService
  ],
})
export class AppModule {}
