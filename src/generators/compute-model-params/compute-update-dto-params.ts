import { BaseModelParamsComputer } from './base-model-params-computer';
import { UpdateDtoFieldConfig } from './configs/update-dto-field-config';
import type { TemplateHelpers } from '../template-helpers';
import type { Model, UpdateDtoParams } from '../types';
import { FieldProcessingConfig } from './shared';

interface ComputeUpdateDtoParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator: boolean;
}

export class UpdateDtoParamsComputer extends BaseModelParamsComputer {
  private fieldConfig: UpdateDtoFieldConfig;

  constructor(templateHelpers: TemplateHelpers) {
    super(templateHelpers);
    this.fieldConfig = new UpdateDtoFieldConfig(templateHelpers);
  }

  protected getFieldConfig(): FieldProcessingConfig {
    return this.fieldConfig;
  }

  computeParams(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator: boolean,
    customDecoratorConfigsPath?: string,
  ): UpdateDtoParams {
    const fieldsWithoutIds = model.fields.filter((field) => !field.isId);

    const modelWithoutIds = {
      ...model,
      fields: fieldsWithoutIds,
    };

    const fieldResult = this.processModelFields(
      modelWithoutIds,
      allModels,
      addExposePropertyDecorator,
      customDecoratorConfigsPath,
    );

    const imports = this.finalizeImports(
      fieldResult.imports,
      fieldResult.fields,
      fieldResult.apiExtraModels.length > 0,
      fieldResult.hasEnum,
    );

    return {
      model,
      fields: fieldResult.fields,
      imports,
      extraClasses: fieldResult.extraClasses,
      apiExtraModels: fieldResult.apiExtraModels,
    };
  }
}

export const computeUpdateDtoParams = ({
  model,
  allModels,
  templateHelpers,
  addExposePropertyDecorator,
}: ComputeUpdateDtoParamsParam): UpdateDtoParams => {
  const computer = new UpdateDtoParamsComputer(templateHelpers);
  return computer.computeParams(model, allModels, addExposePropertyDecorator);
};
