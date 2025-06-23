import { DMMF } from '@prisma/generator-helper';

export interface FieldProcessingConfig {
  relationModifiers: RegExp[];
  canCreateAnnotation: RegExp;
  canConnectAnnotation: RegExp;
  dtoNameGenerator: (name: string) => string;
  optionalAnnotation?: RegExp;
  fieldFilters: {
    shouldSkipField: (field: DMMF.Field) => boolean;
    shouldProcessOptional?: (field: DMMF.Field) => boolean;
  };
  getFieldOverrides: (field: DMMF.Field) => Partial<DMMF.Field>;
}
