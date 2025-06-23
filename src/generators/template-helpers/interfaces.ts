import { ParsedField } from '../types';

export interface TypeProvider {
  fieldType(field: ParsedField, toInputType?: boolean): string;
}

export interface EntityNameProvider {
  entityName(name: string): string;
}
