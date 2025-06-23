import type { DMMF } from '@prisma/generator-helper';
import {
  DTO_UPDATE_OPTIONAL,
  DTO_RELATION_CAN_CONNECT_ON_UPDATE,
  DTO_RELATION_CAN_CRAEATE_ON_UPDATE,
  DTO_RELATION_MODIFIERS_ON_UPDATE,
} from '../../annotations';
import {
  isAnnotatedWith,
  isId,
  isReadOnly,
  isRequiredWithDefaultValue,
  isUpdatedAt,
} from '../../field-classifiers';
import { FieldProcessingConfig } from '../shared';
import { type TemplateHelpers } from '../../template-helpers';

export class UpdateDtoFieldConfig implements FieldProcessingConfig {
  relationModifiers = DTO_RELATION_MODIFIERS_ON_UPDATE;
  canCreateAnnotation = DTO_RELATION_CAN_CRAEATE_ON_UPDATE;
  canConnectAnnotation = DTO_RELATION_CAN_CONNECT_ON_UPDATE;
  optionalAnnotation = DTO_UPDATE_OPTIONAL;

  constructor(private readonly templateHelpers: TemplateHelpers) {}

  dtoNameGenerator = (name: string): string => {
    return this.templateHelpers.updateDtoName(name);
  };

  fieldFilters = {
    shouldSkipField: (field: DMMF.Field): boolean => {
      return isReadOnly(field);
    },

    shouldProcessOptional: (field: DMMF.Field): boolean => {
      const isDtoOptional = isAnnotatedWith(field, DTO_UPDATE_OPTIONAL);

      if (!isDtoOptional) {
        return (
          isId(field) || isUpdatedAt(field) || isRequiredWithDefaultValue(field)
        );
      }

      return false;
    },
  };

  getFieldOverrides = (field: DMMF.Field): Partial<DMMF.Field> => {
    const overrides: Partial<DMMF.Field> = { isRequired: false };

    if (field.kind === 'object') {
      overrides.isList = false;
    }

    return overrides;
  };
}
