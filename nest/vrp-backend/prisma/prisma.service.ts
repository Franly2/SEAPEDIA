/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

//   async withTenant<T>(
//   companyId: string,
//   fn: (tx: PrismaClient) => Promise<T>,
// ): Promise<T> {
//   return this.$transaction(async (tx: any) => { 
//     await tx.$executeRawUnsafe(
//       `SET LOCAL app.current_tenant_id = '${companyId}'`
//       //  untuk tes rls
//       // `SET LOCAL app.current_tenant_id = 'tes'`
//     );
//     return fn(tx);
//   });
// }
}
