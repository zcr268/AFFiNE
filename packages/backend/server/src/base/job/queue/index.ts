import './config';

import { BullModule } from '@nestjs/bullmq';
import { DynamicModule } from '@nestjs/common';

import { Config } from '../../config';
import { QueueRedis } from '../../redis';
import { QUEUES } from './def';
import { JobExecutor } from './executor';
import { JobQueue } from './queue';
import { JobHandlerScanner } from './scanner';

export class JobModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: JobModule,
      imports: [
        BullModule.forRootAsync({
          useFactory: (config: Config, redis: QueueRedis) => {
            return {
              ...config.job.queue,
              connection: redis,
            };
          },
          inject: [Config, QueueRedis],
        }),
        BullModule.registerQueue(...QUEUES.map(name => ({ name }))),
      ],
      providers: [JobQueue, JobExecutor, JobHandlerScanner],
      exports: [JobQueue],
    };
  }
}

export { JobQueue };
export { OnJob } from './def';
