import { TemplateHelpers } from '../template-helpers';
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
}

export const computeModelParams = ({
  model,
  allModels,
  templateHelpers,
  addExposePropertyDecorator,
}: ComputeModelParamsParam): ModelParams => {
  const createComputer = new CreateDtoParamsComputer(templateHelpers);
  const updateComputer = new UpdateDtoParamsComputer(templateHelpers);
  const entityComputer = new EntityParamsComputer(templateHelpers);

  return {
    connect: computeConnectDtoParams({
      model,
      templateHelpers,
      addExposePropertyDecorator,
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
