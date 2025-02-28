import type {
  CanActivate,
  ExecutionContext,
  OnModuleInit,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import {
  getRequestResponseFromContext,
  GuardProvider,
  Runtime,
} from '../../base';
import { VersionService } from './service';

@Injectable()
export class VersionGuardProvider
  extends GuardProvider
  implements CanActivate, OnModuleInit
{
  name = 'version' as const;

  constructor(
    private readonly runtime: Runtime,
    private readonly version: VersionService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    if (!(await this.runtime.fetch('client/versionControl.enabled'))) {
      return true;
    }

    const { req } = getRequestResponseFromContext(context);

    const version = req.headers['x-affine-version'] as string | undefined;

    return this.version.checkVersion(version);
  }
}
