import { logger } from '@prisma/internals';
import { camel, kebab, pascal, snake } from 'case';
import path from 'node:path';
import { DTO_IGNORE_MODEL } from './annotations';
import { computeModelParams } from './compute-model-params';
import { isAnnotatedWith } from './field-classifiers';
import { generateConnectDto } from './generate-connect-dto';
import { generateCreateDto } from './generate-create-dto';
import { generateEntity } from './generate-entity';
import { generateUpdateDto } from './generate-update-dto';
import { TemplateHelpers } from './helpers/template-helpers';

import type { DMMF } from '@prisma/generator-helper';
import type { Model, NamingStyle, WriteableFileSpecs } from './types';

type SpecKey = 'connect' | 'create' | 'update' | 'entity';

type SpecConfig = {
  key: SpecKey;
  dir: 'dto' | 'entity';
  fn: (args: Record<string, unknown>) => string;
  fileName: (name: string, withExt?: boolean) => string;
  extra?: {
    entityPrefix?: string;
    entitySuffix?: string;
    exportRelationModifierClasses?: boolean;
    addExposePropertyDecorator?: boolean;
  };
};

export interface RunParam {
  output: string;
  dmmf: DMMF.Document;
  exportRelationModifierClasses: boolean;
  outputToNestJsResourceStructure: boolean;
  connectDtoPrefix: string;
  createDtoPrefix: string;
  updateDtoPrefix: string;
  dtoSuffix: string;
  entityPrefix: string;
  entitySuffix: string;
  fileNamingStyle: NamingStyle;
  addExposePropertyDecorator: boolean;
  decoratorConfigPath?: string;
}

export class NestJsDtoGenerator {
  private readonly templateHelpers: TemplateHelpers;

  constructor(private readonly params: RunParam) {
    const { fileNamingStyle = 'camel', ...preAndSuffixes } = params;
    const transformers: Record<NamingStyle, (s: string) => string> = {
      camel,
      kebab,
      pascal,
      snake,
    };
    this.templateHelpers = new TemplateHelpers({
      transformFileNameCase: transformers[fileNamingStyle],
      transformClassNameCase: pascal,
      ...preAndSuffixes,
    });
  }

  run(): WriteableFileSpecs[] {
    const models = this.getFilteredModels();
    return models.flatMap((model) => this.generateFilesForModel(model, models));
  }

  private getFilteredModels(): Model[] {
    const { dmmf, output, outputToNestJsResourceStructure } = this.params;
    return dmmf.datamodel.models
      .filter((m) => !isAnnotatedWith(m, DTO_IGNORE_MODEL))
      .map((model) => ({
        ...model,
        output: this.buildOutputPaths(
          model.name,
          output,
          outputToNestJsResourceStructure,
        ),
      }));
  }

  private generateFilesForModel(
    model: Model,
    allModels: Model[],
  ): WriteableFileSpecs[] {
    logger.info(`Processing Model ${model.name}`);

    const { addExposePropertyDecorator, exportRelationModifierClasses } =
      this.params;
    const modelParams = computeModelParams({
      model,
      allModels,
      templateHelpers: this.templateHelpers,
      addExposePropertyDecorator,
      customDecoratorConfigsPath: this.params.decoratorConfigPath,
    });

    const configs: SpecConfig[] = [
      {
        key: 'connect',
        dir: 'dto',
        fn: generateConnectDto as unknown as (
          args: Record<string, unknown>,
        ) => string,
        fileName: this.templateHelpers.connectDtoFilename.bind(
          this.templateHelpers,
        ),
        extra: { exportRelationModifierClasses, addExposePropertyDecorator },
      },
      {
        key: 'create',
        dir: 'dto',
        fn: generateCreateDto as unknown as (
          args: Record<string, unknown>,
        ) => string,
        fileName: this.templateHelpers.createDtoFilename.bind(
          this.templateHelpers,
        ),
        extra: { exportRelationModifierClasses, addExposePropertyDecorator },
      },
      {
        key: 'update',
        dir: 'dto',
        fn: generateUpdateDto as unknown as (
          args: Record<string, unknown>,
        ) => string,
        fileName: this.templateHelpers.updateDtoFilename.bind(
          this.templateHelpers,
        ),
        extra: { exportRelationModifierClasses, addExposePropertyDecorator },
      },
      {
        key: 'entity',
        dir: 'entity',
        fn: generateEntity as unknown as (
          args: Record<string, unknown>,
        ) => string,
        fileName: this.templateHelpers.entityFilename.bind(
          this.templateHelpers,
        ),
        extra: {
          entityPrefix: this.params.entityPrefix,
          entitySuffix: this.params.entitySuffix,
        },
      },
    ];

    return configs
      .map((config) => {
        const { key, dir, fn, fileName, extra } = config;

        const content = fn({
          ...modelParams[key],
          templateHelpers: this.templateHelpers,
          ...(extra ?? {}),
        });

        return {
          fileName: path.join(model.output[dir], fileName(model.name, true)),
          content,
        };
      })
      .filter((file): file is WriteableFileSpecs => file !== null);
  }

  private buildOutputPaths(
    modelName: string,
    baseOutput: string,
    nested: boolean,
  ): { dto: string; entity: string } {
    const segment = this.templateHelpers.transformFileNameCase(modelName);
    const dtoDir = nested ? path.join(baseOutput, segment, 'dto') : baseOutput;
    const entityDir = nested
      ? path.join(baseOutput, segment, 'entities')
      : baseOutput;
    return { dto: dtoDir, entity: entityDir };
  }
}

export const run = (params: RunParam): WriteableFileSpecs[] =>
  new NestJsDtoGenerator(params).run();
