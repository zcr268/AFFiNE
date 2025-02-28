import { Args, Mutation, Resolver } from '@nestjs/graphql';
import type { TestFn } from 'ava';
import ava from 'ava';
import GraphQLUpload, {
  type FileUpload,
} from 'graphql-upload/GraphQLUpload.mjs';
import request from 'supertest';

import { buildAppModule } from '../../app.module';
import { Public } from '../../core/auth';
import { createTestingApp, TestingApp } from '../utils';

const gql = '/graphql';

const test = ava as TestFn<{
  app: TestingApp;
}>;

@Resolver(() => String)
class TestResolver {
  @Public()
  @Mutation(() => Number)
  async upload(
    @Args({ name: 'body', type: () => GraphQLUpload })
    body: FileUpload
  ): Promise<number> {
    const size = await new Promise<number>((resolve, reject) => {
      const stream = body.createReadStream();
      let size = 0;
      stream.on('data', chunk => (size += chunk.length));
      stream.on('error', reject);
      stream.on('end', () => resolve(size));
    });

    return size;
  }
}

test.before('start app', async t => {
  // @ts-expect-error override
  AFFiNE.flavor = {
    type: 'graphql',
    graphql: true,
  } as typeof AFFiNE.flavor;
  const app = await createTestingApp({
    imports: [buildAppModule()],
    providers: [TestResolver],
  });

  t.context.app = app;
});

test.after.always(async t => {
  await t.context.app.close();
});

test('should init app', async t => {
  await request(t.context.app.getHttpServer())
    .post(gql)
    .send({
      query: `
          query {
            error
          }
        `,
    })
    .expect(400);

  const response = await request(t.context.app.getHttpServer())
    .post(gql)
    .send({
      query: `query {
        serverConfig {
          name
          version
          type
          features
        }
      }`,
    })
    .expect(200);

  const config = response.body.data.serverConfig;

  t.is(config.type, 'Affine');
  t.true(Array.isArray(config.features));
  // make sure the request id is set
  t.truthy(response.headers['x-request-id']);
});

test('should return 404 for unknown path', async t => {
  await request(t.context.app.getHttpServer()).get('/unknown').expect(404);

  t.pass();
});

test('should be able to call apis', async t => {
  const res = await request(t.context.app.getHttpServer())
    .get('/info')
    .expect(200);

  t.is(res.body.flavor, 'graphql');
  // make sure the request id is set
  t.truthy(res.headers['x-request-id']);
});

test('should not throw internal error when graphql call with invalid params', async t => {
  await t.throwsAsync(t.context.app.gql(`query { workspace("1") }`), {
    message: /Failed to execute gql: query { workspace\("1"\) \}, status: 400/,
  });
});

test('should can send maximum size of body', async t => {
  const { app } = t.context;

  const body = Buffer.from('a'.repeat(10 * 1024 * 1024 - 1));
  const res = await app
    .POST('/graphql')
    .set({ 'x-request-id': 'test', 'x-operation-name': 'test' })
    .field(
      'operations',
      JSON.stringify({
        name: 'upload',
        query: `mutation upload($body: Upload!) { upload(body: $body) }`,
        variables: { body: null },
      })
    )
    .field('map', JSON.stringify({ '0': ['variables.body'] }))
    .attach(
      '0',
      body,
      `body-${Math.random().toString(16).substring(2, 10)}.data`
    )
    .expect(200);

  t.is(Number(res.body.data.upload), body.length);
});
