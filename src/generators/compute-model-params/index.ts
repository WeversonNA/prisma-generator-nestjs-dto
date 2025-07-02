import type { TemplateHelpers } from '../helpers/template-helpers';
import { computeConnectDtoParams } from './compute-connect-dto-params';
import { CreateDtoParamsComputer } from './compute-create-dto-params';
import { UpdateDtoParamsComputer } from './compute-update-dto-params';
import { EntityParamsComputer } from './compute-entity-params';

import type { Model, ModelParams } from '../types';

interface ComputeModelParamsParam {
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator: boolean;
  customDecoratorConfigsPath?: string;
}

export const computeModelParams = ({
  model,
  allModels,
  templateHelpers,
  addExposePropertyDecorator,
  customDecoratorConfigsPath,
}: ComputeModelParamsParam): ModelParams => {
  const createComputer = new CreateDtoParamsComputer(
    templateHelpers,
    customDecoratorConfigsPath,
  );
  const updateComputer = new UpdateDtoParamsComputer(
    templateHelpers,
    customDecoratorConfigsPath,
  );
  const entityComputer = new EntityParamsComputer(
    templateHelpers,
    customDecoratorConfigsPath,
  );

  return {
    connect: computeConnectDtoParams({
      model,
      templateHelpers,
      addExposePropertyDecorator,
      customDecoratorConfigsPath,
    }),

    create: createComputer.computeParams(
      model,
      allModels,
      addExposePropertyDecorator,
    ),

    update: updateComputer.computeParams(
      model,
      allModels,
      addExposePropertyDecorator,
    ),

    entity: entityComputer.computeParams(model, allModels),
  };
};
