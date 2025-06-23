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
}

export class CreateDtoParamsComputer extends BaseModelParamsComputer {
  private fieldConfig: CreateDtoFieldConfig;

  constructor(templateHelpers: TemplateHelpers) {
    super(templateHelpers);
    this.fieldConfig = new CreateDtoFieldConfig(templateHelpers);
  }

  protected getFieldConfig(): FieldProcessingConfig {
    return this.fieldConfig;
  }

  computeParams(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator: boolean,
    customDecoratorConfigsPath?: string,
  ): CreateDtoParams {
    const fieldResult = this.processModelFields(
      model,
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

export const computeCreateDtoParams = ({
  model,
  allModels,
  templateHelpers,
  addExposePropertyDecorator,
}: ComputeCreateDtoParamsParam): CreateDtoParams => {
  const computer = new CreateDtoParamsComputer(templateHelpers);
  return computer.computeParams(model, allModels, addExposePropertyDecorator);
};
