import '../../style.css';

import * as blockStd from '@blocksuite/block-std';
import * as blocks from '@blocksuite/blocks';
import { effects as blocksEffects } from '@blocksuite/blocks/effects';
import * as globalUtils from '@blocksuite/global/utils';
import * as editor from '@blocksuite/integration-test';
import { effects as presetsEffects } from '@blocksuite/integration-test/effects';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as store from '@blocksuite/store';

import { setupEdgelessTemplate } from '../_common/setup.js';
import { effects as commentEffects } from '../comment/effects.js';
import {
  createStarterDocCollection,
  initStarterDocCollection,
} from './utils/collection.js';
import { mountDefaultDocEditor } from './utils/setup-playground';
import { prepareTestApp } from './utils/test';

blocksEffects();
presetsEffects();
commentEffects();

async function main() {
  if (window.collection) return;

  setupEdgelessTemplate();

  const params = new URLSearchParams(location.search);
  const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
  const isE2E = room.startsWith('playwright');
  const collection = createStarterDocCollection();

  if (isE2E) {
    Object.defineProperty(window, '$blocksuite', {
      value: Object.freeze({
        store,
        blocks,
        global: { utils: globalUtils },
        editor,
        blockStd: blockStd,
      }),
    });
    await prepareTestApp(collection);

    return;
  }

  await initStarterDocCollection(collection);
  await mountDefaultDocEditor(collection);
}

main().catch(console.error);
