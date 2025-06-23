import type { TemplateHelpers } from '../template-helpers';
import type { Model, ImportStatementParams, ParsedField } from '../types';
import { ImportManager } from './shared/import-manager';
import { Helpers } from '../helpers';
import { DecoratorStrategy } from '../decorator-strategy';
import { FieldProcessor, FieldProcessingConfig } from './shared';

export abstract class BaseModelParamsComputer {
  protected readonly fieldProcessor: FieldProcessor;
  protected readonly helpers: Helpers;

  constructor(protected readonly templateHelpers: TemplateHelpers) {
    this.fieldProcessor = new FieldProcessor(templateHelpers);
    this.helpers = new Helpers(new DecoratorStrategy());
  }

  protected abstract getFieldConfig(): FieldProcessingConfig;

  protected hasApiPropertyDoc(fields: ParsedField[]): boolean {
    return (
      (this.templateHelpers.constructor as any).hasSomeApiPropertyDoc?.(
        fields,
      ) || false
    );
  }

  protected processModelFields(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator: boolean = false,
    customDecoratorConfigsPath?: string,
  ) {
    const config = this.getFieldConfig();

    return this.fieldProcessor.processFields(
      model,
      allModels,
      config,
      addExposePropertyDecorator,
      customDecoratorConfigsPath,
    );
  }

  protected finalizeImports(
    imports: ImportStatementParams[],
    fields: ParsedField[],
    hasApiExtraModels: boolean,
    hasEnum: boolean,
  ): ImportStatementParams[] {
    return ImportManager.finalizeImports(imports, fields, {
      hasApiExtraModels,
      hasEnum,
      hasApiPropertyDoc: this.hasApiPropertyDoc(fields),
    });
  }

  protected abstract computeParams(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator?: boolean,
    customDecoratorConfigsPath?: string,
  ): any;
}
