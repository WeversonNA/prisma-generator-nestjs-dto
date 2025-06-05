import {
  DTO_RELATION_CAN_CONNECT_ON_UPDATE,
  DTO_RELATION_CAN_CRAEATE_ON_UPDATE,
  DTO_RELATION_MODIFIERS_ON_UPDATE,
  DTO_UPDATE_OPTIONAL,
} from '../annotations';
import {
  isAnnotatedWith,
  isAnnotatedWithOneOf,
  isId,
  isReadOnly,
  isRelation,
  isRequiredWithDefaultValue,
  isUpdatedAt,
} from '../field-classifiers';
import { Helpers } from '../helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from '../template-helpers';
import type {
  ImportStatementParams,
  Model,
  ParsedField,
  UpdateDtoParams,
} from '../types';

interface ComputeUpdateDtoParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator: boolean;
}
export const computeUpdateDtoParams = ({
  model,
  allModels,
  templateHelpers,
  addExposePropertyDecorator,
}: ComputeUpdateDtoParamsParam): UpdateDtoParams => {
  let hasEnum = false;
  const imports: ImportStatementParams[] = [];
  const extraClasses: string[] = [];
  const apiExtraModels: string[] = [];

  const relationScalarFields = Helpers.getRelationScalars(model.fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const fields = model.fields.reduce((result, field) => {
    const { name } = field;
    const overrides: Partial<DMMF.Field> = { isRequired: false };

    if (isReadOnly(field)) return result;
    if (isRelation(field)) {
      if (!isAnnotatedWithOneOf(field, DTO_RELATION_MODIFIERS_ON_UPDATE)) {
        return result;
      }
      const relationInputType = Helpers.generateRelationInput({
        field,
        model,
        allModels,
        templateHelpers,
        preAndSuffixClassName: (name: string) =>
          templateHelpers.updateDtoName(name),
        canCreateAnnotation: DTO_RELATION_CAN_CRAEATE_ON_UPDATE,
        canConnectAnnotation: DTO_RELATION_CAN_CONNECT_ON_UPDATE,
        addExposePropertyDecorator,
      });

      overrides.type = relationInputType.type;
      overrides.isList = false;

      Helpers.concatIntoArray(relationInputType.imports, imports);
      Helpers.concatIntoArray(relationInputType.generatedClasses, extraClasses);
      Helpers.concatIntoArray(relationInputType.apiExtraModels, apiExtraModels);
    }
    if (relationScalarFieldNames.includes(name)) return result;

    // fields annotated with @DtoReadOnly are filtered out before this
    // so this safely allows to mark fields that are required in Prisma Schema
    // as **not** required in UpdateDTO
    const isDtoOptional = isAnnotatedWith(field, DTO_UPDATE_OPTIONAL);

    if (!isDtoOptional) {
      if (isId(field)) return result;
      if (isUpdatedAt(field)) return result;
      if (isRequiredWithDefaultValue(field)) return result;
    }

    if (field.kind === 'enum') hasEnum = true;

    return [...result, Helpers.mapDMMFToParsedField(field, overrides)];
  }, [] as ParsedField[]);

  if (apiExtraModels.length || hasEnum) {
    const destruct = [];
    if (apiExtraModels.length) destruct.push('ApiExtraModels');
    if (hasEnum) destruct.push('ApiProperty');
    imports.unshift({ from: '@nestjs/swagger', destruct });
  }

  const importPrismaClient = Helpers.makeImportsFromPrismaClient(fields);
  if (importPrismaClient) imports.unshift(importPrismaClient);

  return {
    model,
    fields,
    imports: Helpers.zipImportStatementParams(imports),
    extraClasses,
    apiExtraModels,
  };
};
