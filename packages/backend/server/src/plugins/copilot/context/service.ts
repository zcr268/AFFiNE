import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import {
  Cache,
  CopilotInvalidContext,
  CopilotSessionNotFound,
} from '../../../base';
import { ContextSession } from './session';
import { ContextConfig, ContextConfigSchema } from './types';

const CONTEXT_SESSION_KEY = 'context-session';

@Injectable()
export class CopilotContextService {
  constructor(
    private readonly cache: Cache,
    private readonly db: PrismaClient
  ) {}

  private async saveConfig(
    contextId: string,
    config: ContextConfig,
    refreshCache = false
  ): Promise<void> {
    if (!refreshCache) {
      await this.db.aiContext.update({
        where: { id: contextId },
        data: { config },
      });
    }
    await this.cache.set(`${CONTEXT_SESSION_KEY}:${contextId}`, config);
  }

  private async getCachedSession(
    contextId: string
  ): Promise<ContextSession | undefined> {
    const cachedSession = await this.cache.get(
      `${CONTEXT_SESSION_KEY}:${contextId}`
    );
    if (cachedSession) {
      const config = ContextConfigSchema.safeParse(cachedSession);
      if (config.success) {
        return new ContextSession(
          contextId,
          config.data,
          this.saveConfig.bind(this, contextId)
        );
      }
    }
    return undefined;
  }

  // NOTE: we only cache config to avoid frequent database queries
  // but we do not need to cache session instances because a distributed
  // lock is already apply to mutation operation for the same context in
  // the resolver, so there will be no simultaneous writing to the config
  private async cacheSession(
    contextId: string,
    config: ContextConfig
  ): Promise<ContextSession> {
    const dispatcher = this.saveConfig.bind(this, contextId);
    await dispatcher(config, true);
    return new ContextSession(contextId, config, dispatcher);
  }

  async create(sessionId: string): Promise<ContextSession> {
    const session = await this.db.aiSession.findFirst({
      where: { id: sessionId },
      select: { workspaceId: true },
    });
    if (!session) {
      throw new CopilotSessionNotFound();
    }

    // keep the context unique per session
    const existsContext = await this.getBySessionId(sessionId);
    if (existsContext) return existsContext;

    const context = await this.db.aiContext.create({
      data: {
        sessionId,
        config: { workspaceId: session.workspaceId, docs: [], files: [] },
      },
    });

    const config = ContextConfigSchema.parse(context.config);
    return await this.cacheSession(context.id, config);
  }

  async get(id: string): Promise<ContextSession> {
    const context = await this.getCachedSession(id);
    if (context) return context;
    const ret = await this.db.aiContext.findUnique({
      where: { id },
      select: { config: true },
    });
    if (ret) {
      const config = ContextConfigSchema.safeParse(ret.config);
      if (config.success) return this.cacheSession(id, config.data);
    }
    throw new CopilotInvalidContext({ contextId: id });
  }

  async getBySessionId(sessionId: string): Promise<ContextSession | null> {
    const existsContext = await this.db.aiContext.findFirst({
      where: { sessionId },
      select: { id: true },
    });
    if (existsContext) return this.get(existsContext.id);
    return null;
  }
}
