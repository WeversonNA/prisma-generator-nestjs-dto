import { ParsedField, ImportStatementParams } from '../types';

export class PrismaClientImportHelper {
  static makeImportsFromPrismaClient(
    fields: ParsedField[],
  ): ImportStatementParams | null {
    const enumsToImport = this.getUniqueEnums(fields);
    const importPrisma = this.needsPrismaImport(fields);

    if (!enumsToImport.length && !importPrisma) return null;

    return {
      from: '@prisma/client',
      destruct: importPrisma ? ['Prisma', ...enumsToImport] : enumsToImport,
    };
  }

  private static getUniqueEnums(fields: ParsedField[]): string[] {
    return Array.from(
      new Set(
        fields.filter(({ kind }) => kind === 'enum').map(({ type }) => type),
      ),
    );
  }

  private static needsPrismaImport(fields: ParsedField[]): boolean {
    return fields
      .filter(({ kind }) => kind === 'scalar')
      .some(({ type }) => {
        return ['Decimal', 'Json', 'Bytes'].includes(type);
      });
  }
}
