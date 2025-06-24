import { BaseModelParamsComputer } from './base-model-params-computer';
import { CreateDtoFieldConfig } from './configs/create-dto-field-config';
import type { TemplateHelpers } from '../template-helpers';
import type { Model, CreateDtoParams } from '../types';
import { FieldProcessingConfig } from './shared';

interface ComputeCreateDtoParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator: boolean;
  customDecoratorConfigsPath?: string;
}

export class CreateDtoParamsComputer extends BaseModelParamsComputer {
  private fieldConfig: CreateDtoFieldConfig;

  constructor(
    templateHelpers: TemplateHelpers,
    protected customDecoratorConfigsPath?: string,
  ) {
    super(templateHelpers, customDecoratorConfigsPath);
    this.fieldConfig = new CreateDtoFieldConfig(templateHelpers);
  }

  protected getFieldConfig(): FieldProcessingConfig {
    return this.fieldConfig;
  }

  computeParams(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator: boolean,
  ): CreateDtoParams {
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

export const computeCreateDtoParams = ({
  model,
  allModels,
  templateHelpers,
  addExposePropertyDecorator,
  customDecoratorConfigsPath,
}: ComputeCreateDtoParamsParam): CreateDtoParams => {
  const computer = new CreateDtoParamsComputer(
    templateHelpers,
    customDecoratorConfigsPath,
  );
  return computer.computeParams(model, allModels, addExposePropertyDecorator);
};
