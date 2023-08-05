export interface Config {
  debug?: boolean | DebugConfig;
}

interface DebugConfig {
  /** 原始输出 */
  raw?: boolean;
}

/** @internal */
export const config: Config = {};

export function setupConfig(cfg: Config) {
  Object.assign(config, cfg);
}
