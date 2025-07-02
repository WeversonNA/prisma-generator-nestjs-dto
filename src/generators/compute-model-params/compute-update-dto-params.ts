import { BaseModelParamsComputer } from './base-model-params-computer';
import { UpdateDtoFieldConfig } from './configs/update-dto-field-config';
import type { TemplateHelpers } from '../helpers/template-helpers';
import type { Model, UpdateDtoParams } from '../types';
import type { FieldProcessingConfig } from './shared';

interface ComputeUpdateDtoParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator: boolean;
  customDecoratorConfigsPath?: string;
}

export class UpdateDtoParamsComputer extends BaseModelParamsComputer {
  private fieldConfig: UpdateDtoFieldConfig;

  constructor(
    templateHelpers: TemplateHelpers,
    protected customDecoratorConfigsPath?: string,
  ) {
    super(templateHelpers, customDecoratorConfigsPath);
    this.fieldConfig = new UpdateDtoFieldConfig(templateHelpers);
  }

  protected getFieldConfig(): FieldProcessingConfig {
    return this.fieldConfig;
  }

  computeParams(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator: boolean,
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
  customDecoratorConfigsPath,
}: ComputeUpdateDtoParamsParam): UpdateDtoParams => {
  const computer = new UpdateDtoParamsComputer(
    templateHelpers,
    customDecoratorConfigsPath,
  );
  return computer.computeParams(model, allModels, addExposePropertyDecorator);
};
