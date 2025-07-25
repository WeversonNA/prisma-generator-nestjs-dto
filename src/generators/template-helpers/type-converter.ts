import type { ParsedField } from '../types';

export interface TypeConverter {
  scalarToTS(scalar: string, useInputTypes?: boolean): string;
  fieldType(field: ParsedField, toInputType?: boolean): string;
}

export class PrismaTypeConverter implements TypeConverter {
  private static readonly PrismaScalarToTypeScript: Record<string, string> = {
    String: 'string',
    Boolean: 'boolean',
    Int: 'number',
    BigInt: 'bigint',
    Float: 'number',
    Decimal: 'Prisma.Decimal',
    DateTime: 'Date',
    Json: 'Prisma.JsonValue',
    Bytes: 'Buffer',
  };

  private static readonly knownPrismaScalarTypes: string[] = Object.keys(
    PrismaTypeConverter.PrismaScalarToTypeScript,
  );

  scalarToTS(scalar: string, useInputTypes = false): string {
    if (!PrismaTypeConverter.knownPrismaScalarTypes.includes(scalar)) {
      throw new Error(`Unrecognized scalar type: ${scalar}`);
    }
    if (useInputTypes && scalar === 'Json') {
      return 'Prisma.InputJsonValue';
    }
    return PrismaTypeConverter.PrismaScalarToTypeScript[scalar];
  }

  fieldType(
    field: ParsedField,
    toInputType = false,
    entityPrefix = '',
    entitySuffix = '',
  ): string {
    switch (field.kind) {
      case 'scalar':
        return this.scalarToTS(field.type, toInputType);
      case 'enum':
        return `${field.type}${field.isList ? '[]' : ''}`;
      case 'relation-input':
        return `${entityPrefix}${field.type}${entitySuffix}`;
      default:
        // For relation fields, we need entity name + optional array notation
        return `${entityPrefix}${field.type}${entitySuffix}${field.isList ? '[]' : ''}`;
    }
  }
}
