import {
  DTO_CREATE_OPTIONAL,
  DTO_RELATION_CAN_CONNECT_ON_CREATE,
  DTO_RELATION_CAN_CRAEATE_ON_CREATE,
  DTO_RELATION_MODIFIERS_ON_CREATE,
  DTO_RELATION_REQUIRED,
} from '../annotations';
import {
  isAnnotatedWith,
  isAnnotatedWithOneOf,
  isIdWithDefaultValue,
  isReadOnly,
  isRelation,
  isRequiredWithDefaultValue,
  isUpdatedAt,
} from '../field-classifiers';

import type { DMMF } from '@prisma/generator-helper';
import { TemplateHelpers } from '../template-helpers';
import type {
  Model,
  CreateDtoParams,
  ImportStatementParams,
  ParsedField,
} from '../types';
import { Helpers } from '../helpers';

interface ComputeCreateDtoParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator: boolean;
}
export const computeCreateDtoParams = ({
  model,
  allModels,
  templateHelpers,
  addExposePropertyDecorator,
}: ComputeCreateDtoParamsParam): CreateDtoParams => {
  let hasEnum = false;
  const imports: ImportStatementParams[] = [];
  const apiExtraModels: string[] = [];
  const extraClasses: string[] = [];

  const relationScalarFields = Helpers.getRelationScalars(model.fields);
  const relationScalarFieldNames = Object.keys(relationScalarFields);

  const fields = model.fields.reduce((result, field) => {
    const { name } = field;
    const overrides: Partial<DMMF.Field> = {};

    if (isReadOnly(field)) return result;
    if (isRelation(field)) {
      if (!isAnnotatedWithOneOf(field, DTO_RELATION_MODIFIERS_ON_CREATE)) {
        return result;
      }
      const relationInputType = Helpers.generateRelationInput({
        field,
        model,
        allModels,
        templateHelpers,
        preAndSuffixClassName: (name: string) =>
          templateHelpers.createDtoName(name),
        canCreateAnnotation: DTO_RELATION_CAN_CRAEATE_ON_CREATE,
        canConnectAnnotation: DTO_RELATION_CAN_CONNECT_ON_CREATE,
        addExposePropertyDecorator,
      });

      const isDtoRelationRequired = isAnnotatedWith(
        field,
        DTO_RELATION_REQUIRED,
      );
      if (isDtoRelationRequired) overrides.isRequired = true;

      // list fields can not be required
      // TODO maybe throw an error if `isDtoRelationRequired` and `isList`
      if (field.isList) overrides.isRequired = false;

      overrides.type = relationInputType.type;
      // since relation input field types are translated to something like { connect: Foo[] }, the field type itself is not a list anymore.
      // You provide list input in the nested `connect` or `create` properties.
      overrides.isList = false;
      Helpers.concatIntoArray(relationInputType.imports, imports);
      Helpers.concatIntoArray(relationInputType.generatedClasses, extraClasses);
      Helpers.concatIntoArray(relationInputType.apiExtraModels, apiExtraModels);
    }
    if (relationScalarFieldNames.includes(name)) return result;

    // fields annotated with @DtoReadOnly are filtered out before this
    // so this safely allows to mark fields that are required in Prisma Schema
    // as **not** required in CreateDTO
    const isDtoOptional = isAnnotatedWith(field, DTO_CREATE_OPTIONAL);

    if (!isDtoOptional) {
      if (isIdWithDefaultValue(field)) return result;
      if (isUpdatedAt(field)) return result;
      if (isRequiredWithDefaultValue(field)) return result;
    }
    if (isDtoOptional) {
      overrides.isRequired = false;
    }

    if (field.kind === 'enum') hasEnum = true;

    return [...result, Helpers.mapDMMFToParsedField(field, overrides)];
  }, [] as ParsedField[]);

  const hasApiPropertyDoc = TemplateHelpers.hasSomeApiPropertyDoc(fields);

  if (apiExtraModels.length || hasEnum || hasApiPropertyDoc) {
    const destruct = [];
    if (apiExtraModels.length) destruct.push('ApiExtraModels');
    if (hasEnum) destruct.push('ApiProperty');
    if (hasApiPropertyDoc) {
      destruct.push('ApiProperty');
    }
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
