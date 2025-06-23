import { BaseModelParamsComputer } from './base-model-params-computer';
import { ConnectDtoFieldConfig } from './configs/connect-dto-field-config';
import type { FieldProcessingConfig } from './shared';
import { Helpers } from '../helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from '../template-helpers';
import type { ConnectDtoParams, ImportStatementParams, Model } from '../types';
import { isId, isUnique } from '../field-classifiers';

interface ComputeConnectDtoParamsParam {
  model: DMMF.Model;
  templateHelpers?: TemplateHelpers;
  addExposePropertyDecorator: boolean;
}

export class ConnectDtoParamsComputer extends BaseModelParamsComputer {
  private fieldConfig: ConnectDtoFieldConfig;

  constructor(templateHelpers?: TemplateHelpers) {
    super(templateHelpers as TemplateHelpers);
    this.fieldConfig = new ConnectDtoFieldConfig(
      templateHelpers as TemplateHelpers,
    );
  }

  protected getFieldConfig(): FieldProcessingConfig {
    return this.fieldConfig;
  }

  computeParams(
    model: DMMF.Model,
    _allModels?: Model[],
    addExposePropertyDecorator?: boolean,
    customDecoratorConfigsPath?: string,
  ): ConnectDtoParams {
    const idFields = model.fields.filter((field) => isId(field));
    const isUniqueFields = model.fields.filter((field) => isUnique(field));
    const uniqueFields = Helpers.uniq([...idFields, ...isUniqueFields]);

    const overrides = uniqueFields.length > 1 ? { isRequired: false } : {};

    const fields = uniqueFields.map((field: DMMF.Field) =>
      Helpers.mapDMMFToParsedField(field, overrides),
    );

    let imports: ImportStatementParams[] = [];
    if (this.templateHelpers) {
      const fieldResult = this.processModelFields(
        model as Model,
        [],
        addExposePropertyDecorator,
        customDecoratorConfigsPath,
      );

      imports = this.finalizeImports(
        fieldResult.imports,
        fields,
        false,
        fieldResult.hasEnum,
      );
    } else {
      const importPrismaClient = Helpers.makeImportsFromPrismaClient(fields);
      if (importPrismaClient) {
        imports.push(importPrismaClient);
      }

      imports = Helpers.zipImportStatementParams(imports);
    }

    return {
      model,
      fields,
      imports,
    };
  }
}

export const computeConnectDtoParams = ({
  model,
  templateHelpers,
  addExposePropertyDecorator,
}: ComputeConnectDtoParamsParam): ConnectDtoParams => {
  const computer = new ConnectDtoParamsComputer(templateHelpers);
  return computer.computeParams(model, [], addExposePropertyDecorator);
};
