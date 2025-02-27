import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import test from 'ava';

import { decodeAudio, Mp3Encoder } from '../index.js';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const wav = await readFile(join(__dirname, 'fixtures', 'recording.wav'));

test('convert wav to mp3', async t => {
  const audio = await decodeAudio(wav);
  const mp3 = new Mp3Encoder({
    channels: 1,
  });
  await t.notThrowsAsync(async () => {
    const mp3Data = mp3.encode(audio);
    await writeFile(join(tmpdir(), 'recording.mp3'), mp3Data);
  });
});
