import { ParsedField } from '../types';

export interface TypeProvider {
  fieldType(
    field: ParsedField,
    toInputType?: boolean,
    entityPrefix?: string,
    entitySuffix?: string,
  ): string;
}

export interface EntityNameProvider {
  entityName(name: string): string;
}
