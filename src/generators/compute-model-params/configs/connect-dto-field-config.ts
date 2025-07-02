import type { DMMF } from '@prisma/generator-helper';
import type { FieldProcessingConfig } from '../shared';
import { isId, isUnique } from '../../field-classifiers';
import { type TemplateHelpers } from '../../helpers/template-helpers';

export class ConnectDtoFieldConfig implements FieldProcessingConfig {
  relationModifiers: RegExp[] = [];
  canCreateAnnotation: RegExp = /^$/;
  canConnectAnnotation: RegExp = /^$/;

  constructor(private readonly templateHelpers: TemplateHelpers) {}

  dtoNameGenerator = (name: string): string => {
    return this.templateHelpers.connectDtoName(name);
  };

  fieldFilters = {
    shouldSkipField: (field: DMMF.Field): boolean => {
      return !isId(field) && !isUnique(field);
    },

    shouldProcessOptional: (): boolean => {
      return false;
    },
  };

  getFieldOverrides = (
    _field: DMMF.Field,
    uniqueFieldsCount?: number,
  ): Partial<DMMF.Field> => {
    const overrides: Partial<DMMF.Field> = {};

    if (uniqueFieldsCount && uniqueFieldsCount > 1) {
      overrides.isRequired = false;
    }

    return overrides;
  };
}
