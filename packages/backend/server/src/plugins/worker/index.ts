import './config';

import { Plugin } from '../registry';
import { WorkerController } from './controller';

@Plugin({
  name: 'worker',
  controllers: [WorkerController],
  if: config => config.isSelfhosted || config.node.dev || config.node.test,
})
export class WorkerModule {}
