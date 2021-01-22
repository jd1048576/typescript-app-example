declare module "level" {
  export interface Level {
    clear: () => Promise<void>;
    close: () => Promise<void>;
    del: (key: string) => Promise<void>;
    get: (
      key: string,
      options?: {
        fillCache: boolean;
        asBuffer: boolean;
      }
    ) => Promise<string>;
    put: (key: string, value: string) => Promise<void>;
  }

  export interface Options {
    createIfMissing: boolean;
    errorIfExists: boolean;
    compression: boolean;
    cacheSize: number;
  }

  export interface LevelConstructor {
    (location: string, options?: Options): Level;
  }

  const Level: LevelConstructor;
  export = Level;
}
