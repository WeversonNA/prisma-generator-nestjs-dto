import type { TemplateHelpers } from '../template-helpers';
import type { Model, ImportStatementParams, ParsedField } from '../types';
import { ImportManager } from './shared/import-manager';
import { Helpers } from '../helpers';
import { DecoratorStrategy } from '../decorators/decorator-strategy';
import { FieldProcessor, FieldProcessingConfig } from './shared';

export abstract class BaseModelParamsComputer {
  protected readonly fieldProcessor: FieldProcessor;
  protected readonly helpers: Helpers;

  constructor(
    protected readonly templateHelpers: TemplateHelpers,
    protected readonly customDecoratorConfigsPath?: string,
  ) {
    this.fieldProcessor = new FieldProcessor(
      templateHelpers,
      customDecoratorConfigsPath,
    );
    this.helpers = new Helpers(
      new DecoratorStrategy(customDecoratorConfigsPath),
    );
  }

  protected abstract getFieldConfig(): FieldProcessingConfig;

  protected hasApiPropertyDoc(fields: ParsedField[]): boolean {
    return (
      (this.templateHelpers.constructor as any).hasSomeApiPropertyDoc?.(
        fields,
        this.customDecoratorConfigsPath,
      ) || false
    );
  }

  protected processModelFields(
    model: Model,
    allModels: Model[],
    addExposePropertyDecorator: boolean = false,
  ) {
    const config = this.getFieldConfig();

    return this.fieldProcessor.processFields(
      model,
      allModels,
      config,
      addExposePropertyDecorator,
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
  ): any;
}
