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

@Module({
  imports: [PrismaModule,
    AuthModule,
    // VrpModule,
    // TenantModule,
    // SalesModule,
    // DepotModule,
    // HumanModule,
    // CatalogModule,
    ],
  controllers: [
    AppController, 
    // SalesController
  ],
  providers: [
    AppService, 
    // SalesService
  ],
})
export class AppModule {}
