import { Global, Module, Provider } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from './service';

// only `PrismaClient` can be injected
const clientProvider: Provider = {
  provide: PrismaClient,
  useClass: PrismaService,
};

@Global()
@Module({
  providers: [clientProvider],
  exports: [clientProvider],
})
export class PrismaModule {}
export { PrismaService } from './service';

export type Transaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
