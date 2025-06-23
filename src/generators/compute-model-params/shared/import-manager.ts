import type { ImportStatementParams, ParsedField } from '../../types';
import { Helpers } from '../../helpers';

export class ImportManager {
  static addSwaggerImports(
    imports: ImportStatementParams[],
    conditions: {
      hasApiExtraModels: boolean;
      hasEnum: boolean;
      hasApiPropertyDoc?: boolean;
    },
  ): void {
    const { hasApiExtraModels, hasEnum, hasApiPropertyDoc } = conditions;

    if (hasApiExtraModels || hasEnum || hasApiPropertyDoc) {
      const destruct: string[] = [];

      if (hasApiExtraModels) destruct.push('ApiExtraModels');
      if (hasEnum) destruct.push('ApiProperty');
      if (hasApiPropertyDoc) destruct.push('ApiProperty');

      const uniqueDestruct = [...new Set(destruct)];

      imports.unshift({ from: '@nestjs/swagger', destruct: uniqueDestruct });
    }
  }

  static addPrismaClientImports(
    imports: ImportStatementParams[],
    fields: ParsedField[],
  ): void {
    const importPrismaClient = Helpers.makeImportsFromPrismaClient(fields);
    if (importPrismaClient) {
      imports.unshift(importPrismaClient);
    }
  }

  static finalizeImports(
    imports: ImportStatementParams[],
    fields: ParsedField[],
    conditions: {
      hasApiExtraModels: boolean;
      hasEnum: boolean;
      hasApiPropertyDoc?: boolean;
    },
  ): ImportStatementParams[] {
    this.addSwaggerImports(imports, conditions);

    this.addPrismaClientImports(imports, fields);

    return Helpers.zipImportStatementParams(imports);
  }
}
