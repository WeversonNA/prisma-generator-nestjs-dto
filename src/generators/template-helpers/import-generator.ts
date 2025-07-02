import type { ImportStatementParams } from '../types';

export class ImportStatementGenerator {
  static importStatement(input: ImportStatementParams): string {
    const { from, destruct = [], default: def } = input;
    const parts: string[] = ['import'];

    if (def) {
      parts.push(typeof def === 'string' ? def : `* as ${def['*']}`);
    }

    if (destruct.length) {
      if (def) parts.push(',');
      const inside = destruct
        .flatMap((item) =>
          typeof item === 'string'
            ? [item]
            : Object.entries(item).map(
                ([orig, alias]) => `${orig} as ${alias}`,
              ),
        )
        .join(', ');
      parts.push(`{ ${inside} }`);
    }

    parts.push(`from '${from}'`);
    return parts.join(' ');
  }

  static importStatements(items: ImportStatementParams[]): string {
    return items.map(ImportStatementGenerator.importStatement).join('\n');
  }
}
