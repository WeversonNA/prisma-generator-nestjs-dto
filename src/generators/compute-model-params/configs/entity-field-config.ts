import type { DMMF } from '@prisma/generator-helper';
import { DTO_ENTITY_HIDDEN, DTO_RELATION_REQUIRED } from '../../annotations';
import { isAnnotatedWith, isRelation } from '../../field-classifiers';
import type { FieldProcessingConfig } from '../shared';
import { type TemplateHelpers } from '../../helpers/template-helpers';

export class EntityFieldConfig implements FieldProcessingConfig {
  relationModifiers: RegExp[] = [];
  canCreateAnnotation: RegExp = /^$/;
  canConnectAnnotation: RegExp = /^$/;

  constructor(private readonly templateHelpers: TemplateHelpers) {}

  dtoNameGenerator = (name: string): string => {
    return this.templateHelpers.entityName(name);
  };

  fieldFilters = {
    shouldSkipField: (field: DMMF.Field): boolean => {
      return isAnnotatedWith(field, DTO_ENTITY_HIDDEN);
    },

    shouldProcessOptional: (): boolean => {
      return false;
    },
  };

  getFieldOverrides = (field: DMMF.Field): Partial<DMMF.Field> => {
    const overrides: Partial<DMMF.Field> = {
      isRequired: true,
      isNullable: !field.isRequired,
    };

    if (isRelation(field)) {
      overrides.isRequired = false;
      overrides.isNullable = field.isList
        ? false
        : field.isRequired
          ? false
          : !isAnnotatedWith(field, DTO_RELATION_REQUIRED);
    }

    return overrides;
  };
}
