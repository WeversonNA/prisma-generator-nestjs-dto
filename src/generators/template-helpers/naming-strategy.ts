export interface NamingStrategy {
  transformClassName(name: string, prefix?: string, suffix?: string): string;
  transformFileName(
    name: string,
    prefix?: string,
    suffix?: string,
    withExt?: boolean,
  ): string;
}

export class DefaultNamingStrategy implements NamingStrategy {
  constructor(
    private readonly transformClassNameCase: (input: string) => string,
    private readonly transformFileNameCase: (input: string) => string,
  ) {}

  transformClassName(name: string, prefix = '', suffix = ''): string {
    return `${prefix}${this.transformClassNameCase(name)}${suffix}`;
  }

  transformFileName(
    name: string,
    prefix = '',
    suffix = '',
    withExt = false,
  ): string {
    return `${prefix}${this.transformFileNameCase(
      name,
    )}${suffix}${withExt ? '.ts' : ''}`;
  }
}
