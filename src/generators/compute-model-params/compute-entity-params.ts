import { BaseModelParamsComputer } from './base-model-params-computer';
import { EntityFieldConfig } from './configs/entity-field-config';
import { ImportManager } from './shared/import-manager';
import { Helpers } from '../helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from '../template-helpers';
import type {
  EntityParams,
  ImportStatementParams,
  Model,
  ParsedField,
} from '../types';
import { FieldProcessingConfig } from './shared';
import { DecoratorStrategy } from '../decorator-strategy';

interface ComputeEntityParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
}

export class EntityParamsComputer extends BaseModelParamsComputer {
  private fieldConfig: EntityFieldConfig;

  constructor(templateHelpers: TemplateHelpers) {
    super(templateHelpers);
    this.fieldConfig = new EntityFieldConfig(templateHelpers);
  }

  protected getFieldConfig(): FieldProcessingConfig {
    return this.fieldConfig;
  }

  computeParams(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator?: boolean,
    customDecoratorConfigsPath?: string,
  ): EntityParams {
    const imports: ImportStatementParams[] = [];
    const apiExtraModels: string[] = [];

    const relationScalarFields = Helpers.getRelationScalars(model.fields);
    const relationScalarFieldNames = Object.keys(relationScalarFields);

    const fields = model.fields.reduce((result, field) => {
      const { name } = field;

      if (this.fieldConfig.fieldFilters.shouldSkipField(field)) {
        return result;
      }

      const overrides = this.fieldConfig.getFieldOverrides(field);

      if (field.kind === 'object') {
        this.processEntityRelation(field, model, allModels, imports, overrides);
      }

      if (relationScalarFieldNames.includes(name)) {
        this.processRelationScalarField(
          field,
          model,
          relationScalarFields,
          overrides,
        );
      }

      const decoratorImports = this.processEntityDecorators(
        field,
        customDecoratorConfigsPath,
      );
      imports.push(...decoratorImports);

      return [...result, Helpers.mapDMMFToParsedField(field, overrides)];
    }, [] as ParsedField[]);

    const finalImports = ImportManager.finalizeImports(imports, fields, {
      hasApiExtraModels: apiExtraModels.length > 0,
      hasEnum: false,
      hasApiPropertyDoc: false,
    });

    return {
      model,
      fields,
      imports: finalImports,
      apiExtraModels,
    };
  }

  private processEntityRelation(
    field: DMMF.Field,
    model: Model,
    allModels: Model[],
    imports: ImportStatementParams[],
    overrides: Partial<DMMF.Field>,
  ): void {
    if (field.type !== model.name) {
      const modelToImportFrom = allModels.find((m) => m.name === field.type);

      if (!modelToImportFrom) {
        throw new Error(
          `related model '${field.type}' for '${model.name}.${field.name}' not found`,
        );
      }

      const importName = this.templateHelpers.entityName(field.type);
      const relPath = Helpers.getRelativePath(
        model.output.entity,
        modelToImportFrom.output.entity,
      );
      const importFrom = `${relPath}/${this.templateHelpers.entityFilename(field.type)}`;

      if (
        !imports.some(
          (item) =>
            Array.isArray(item.destruct) &&
            item.destruct.includes(importName) &&
            item.from === importFrom,
        )
      ) {
        imports.push({
          destruct: [importName],
          from: importFrom,
        });
      }
    }
  }

  private processRelationScalarField(
    field: DMMF.Field,
    model: Model,
    relationScalarFields: Record<string, string[]>,
    overrides: Partial<DMMF.Field>,
  ): void {
    const { [field.name]: relationNames } = relationScalarFields;
    const { isRequired, isAnnotatedWith } = require('../field-classifiers');
    const { DTO_RELATION_REQUIRED } = require('../annotations');

    const isAnyRelationRequired = relationNames.some((relationFieldName) => {
      const relationField = model.fields.find(
        (anyField) => anyField.name === relationFieldName,
      );
      if (!relationField) return false;

      return (
        isRequired(relationField) ||
        isAnnotatedWith(relationField, DTO_RELATION_REQUIRED)
      );
    });

    overrides.isRequired = true;
    overrides.isNullable = !isAnyRelationRequired;
  }

  private processEntityDecorators(
    field: DMMF.Field,
    customDecoratorConfigsPath?: string,
  ): ImportStatementParams[] {
    const decoratorStrategy = new DecoratorStrategy(customDecoratorConfigsPath);

    const decorators =
      decoratorStrategy.formatValidDecoratorResultToFromDestruct(
        decoratorStrategy
          .getValidDecoratorAndImportsByDoc(field?.documentation)
          .filter((decorator) =>
            decorator.decoratorName.includes('ApiProperty'),
          ),
      );

    return decorators;
  }
}

export const computeEntityParams = ({
  model,
  allModels,
  templateHelpers,
}: ComputeEntityParamsParam): EntityParams => {
  const computer = new EntityParamsComputer(templateHelpers);
  return computer.computeParams(model, allModels);
};
