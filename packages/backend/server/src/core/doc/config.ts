import {
  defineRuntimeConfig,
  defineStartupConfig,
  ModuleConfig,
} from '../../base/config';

interface DocStartupConfigurations {
  history: {
    /**
     * How long the buffer time of creating a new history snapshot when doc get updated.
     *
     * in {ms}
     */
    interval: number;
  };
}

interface DocRuntimeConfigurations {
  /**
   * Use `y-octo` to merge updates at the same time when merging using Yjs.
   *
   * This is an experimental feature, and aimed to check the correctness of JwstCodec.
   */
  experimentalMergeWithYOcto: boolean;
}

declare module '../../base/config' {
  interface AppConfig {
    doc: ModuleConfig<DocStartupConfigurations, DocRuntimeConfigurations>;
  }
}

defineStartupConfig('doc', {
  history: {
    interval: 1000 * 60 * 10 /* 10 mins */,
  },
});

defineRuntimeConfig('doc', {
  experimentalMergeWithYOcto: {
    desc: 'Use `y-octo` to merge updates at the same time when merging using Yjs.',
    default: false,
  },
});
