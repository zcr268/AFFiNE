/// <reference types="./global.d.ts" />
import './prelude';

import { Logger } from '@nestjs/common';

import { createApp } from './app';
import { URLHelper } from './base';

const app = await createApp();
const listeningHost = '0.0.0.0';
await app.listen(AFFiNE.server.port, listeningHost);
const url = app.get(URLHelper);

const logger = new Logger('App');

logger.log(`AFFiNE Server is running in [${AFFiNE.type}] mode`);
logger.log(`Listening on http://${listeningHost}:${AFFiNE.server.port}`);
logger.log(`And the public server should be recognized as ${url.home}`);
