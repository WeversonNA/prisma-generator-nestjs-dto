import type { DMMF } from '@prisma/generator-helper';
import {
  DTO_CREATE_OPTIONAL,
  DTO_RELATION_CAN_CONNECT_ON_CREATE,
  DTO_RELATION_CAN_CRAEATE_ON_CREATE,
  DTO_RELATION_MODIFIERS_ON_CREATE,
  DTO_RELATION_REQUIRED,
} from '../../annotations';
import {
  isAnnotatedWith,
  isIdWithDefaultValue,
  isReadOnly,
  isRequiredWithDefaultValue,
  isUpdatedAt,
} from '../../field-classifiers';
import type { FieldProcessingConfig } from '../shared';
import { type TemplateHelpers } from '../../helpers/template-helpers';

export class CreateDtoFieldConfig implements FieldProcessingConfig {
  relationModifiers = DTO_RELATION_MODIFIERS_ON_CREATE;
  canCreateAnnotation = DTO_RELATION_CAN_CRAEATE_ON_CREATE;
  canConnectAnnotation = DTO_RELATION_CAN_CONNECT_ON_CREATE;
  optionalAnnotation = DTO_CREATE_OPTIONAL;

  constructor(private readonly templateHelpers: TemplateHelpers) {}

  dtoNameGenerator = (name: string): string => {
    return this.templateHelpers.createDtoName(name);
  };

  fieldFilters = {
    shouldSkipField: (field: DMMF.Field): boolean => {
      return isReadOnly(field);
    },

    shouldProcessOptional: (field: DMMF.Field): boolean => {
      const isDtoOptional = isAnnotatedWith(field, DTO_CREATE_OPTIONAL);

      if (!isDtoOptional) {
        return (
          isIdWithDefaultValue(field) ||
          isUpdatedAt(field) ||
          isRequiredWithDefaultValue(field)
        );
      }

      return false;
    },
  };

  getFieldOverrides = (field: DMMF.Field): Partial<DMMF.Field> => {
    const overrides: Partial<DMMF.Field> = {};

    if (field.kind === 'object') {
      const isDtoRelationRequired = isAnnotatedWith(
        field,
        DTO_RELATION_REQUIRED,
      );
      if (isDtoRelationRequired) {
        overrides.isRequired = true;
      }

      if (field.isList) {
        overrides.isRequired = false;
      }
    } else {
      const isDtoOptional = isAnnotatedWith(field, DTO_CREATE_OPTIONAL);
      if (isDtoOptional) {
        overrides.isRequired = false;
      }
    }

    return overrides;
  };
}
