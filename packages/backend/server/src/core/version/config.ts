import { defineRuntimeConfig, ModuleConfig } from '../../base/config';

export interface VersionConfig {
  versionControl: {
    enabled: boolean;
    requiredVersion: string;
  };
}

declare module '../../base/config' {
  interface AppConfig {
    client: ModuleConfig<never, VersionConfig>;
  }
}

declare module '../../base/guard' {
  interface RegisterGuardName {
    version: 'version';
  }
}

defineRuntimeConfig('client', {
  'versionControl.enabled': {
    desc: 'Whether check version of client before accessing the server.',
    default: false,
  },
  'versionControl.requiredVersion': {
    desc: "Allowed version range of the app that allowed to access the server. Requires 'client/versionControl.enabled' to be true to take effect.",
    default: '>=0.20.0',
  },
});
