import { readFileSync } from 'fs';

export type DecoratorNamePattern = string | RegExp;

export interface DecoratorCategoryConfig {
  importPath: string;
  names: DecoratorNamePattern[];
}

export interface DecoratorImportMapping {
  name: RegExp;
  importPath: string;
}

export class DecoratorConfigProcessor {
  private decoratorImportMap: DecoratorImportMapping[] = [];

  constructor(
    private readonly defaultCategories: DecoratorCategoryConfig[] = [],
    customConfigPath?: string,
  ) {
    this.initialize(customConfigPath);
  }

  get mappings(): ReadonlyArray<DecoratorImportMapping> {
    return this.decoratorImportMap;
  }

  private initialize(customConfigPath?: string): void {
    try {
      const customConfigs = customConfigPath
        ? this.loadCustomConfigs(customConfigPath)
        : [];

      const allConfigs = [
        ...this.defaultCategories,
        ...this.processCustomConfigs(customConfigs),
      ];

      this.decoratorImportMap = this.createMappings(allConfigs);
    } catch (error) {
      throw this.wrapInitializationError(error);
    }
  }

  private loadCustomConfigs(filePath: string): DecoratorCategoryConfig[] {
    let fileContent: string;
    try {
      fileContent = readFileSync(filePath, 'utf8');
    } catch {
      throw new Error(`Failed to read config file at ${filePath}`);
    }

    let parsedConfigs: unknown;
    try {
      parsedConfigs = JSON.parse(fileContent);
    } catch {
      throw new Error('Config file contains invalid JSON');
    }

    return this.validateConfigs(parsedConfigs);
  }

  private validateConfigs(configs: unknown): DecoratorCategoryConfig[] {
    if (!Array.isArray(configs)) {
      throw new Error('Configuration must be an array of decorator categories');
    }

    return configs.map((config, idx) => {
      if (typeof config !== 'object' || config === null) {
        throw new Error(`Config at index ${idx} must be an object`);
      }

      const { importPath, names } = config as Partial<DecoratorCategoryConfig>;

      if (typeof importPath !== 'string' || !importPath.trim()) {
        throw new Error(
          `Config at index ${idx} must have a valid 'importPath'`,
        );
      }

      if (!Array.isArray(names)) {
        throw new Error(`Config at index ${idx} must have an array of 'names'`);
      }

      const validatedNames = names.map((name, nameIdx) => {
        if (typeof name !== 'string' && !(name instanceof RegExp)) {
          throw new Error(
            `Config ${idx}, name ${nameIdx} must be string or RegExp`,
          );
        }
        return name;
      });

      return { importPath, names: validatedNames };
    });
  }

  private processCustomConfigs(
    configs: DecoratorCategoryConfig[],
  ): DecoratorCategoryConfig[] {
    return configs.map(({ importPath, names }) => ({
      importPath,
      names: names.map((name) => this.toRegExp(name)),
    }));
  }

  private toRegExp(pattern: DecoratorNamePattern): RegExp {
    if (pattern instanceof RegExp) return pattern;

    const cleanName = pattern.replace(/^@/, '').trim();
    return new RegExp(`^@${cleanName}(\\(|$)`);
  }

  private createMappings(
    configs: DecoratorCategoryConfig[],
  ): DecoratorImportMapping[] {
    return configs.flatMap(({ importPath, names }) =>
      names.map((name) => ({
        name: this.toRegExp(name),
        importPath,
      })),
    );
  }

  private wrapInitializationError(error: unknown): Error {
    const baseMessage = 'Failed to initialize decorator configurations';

    if (error instanceof Error) {
      return new Error(`${baseMessage}: ${error.message}`);
    }

    return new Error(baseMessage);
  }
}
