import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from '../../template-helpers';
import type { Model, ParsedField, ImportStatementParams } from '../../types';
import { Helpers } from '../../helpers';
import { DecoratorStrategy } from '../../decorator-strategy';
import { FieldProcessingConfig } from '../interfaces/field-processing-config.interface';
import { FieldProcessingResult } from '../interfaces/field-processing-result.interface';
import { isAnnotatedWith, isAnnotatedWithOneOf } from '../../field-classifiers';

export class FieldProcessor {
  private readonly helpers: Helpers;

  constructor(private readonly templateHelpers: TemplateHelpers) {
    this.helpers = new Helpers(new DecoratorStrategy());
  }

  private hasImport(
    imports: Array<{ destruct?: (string | Record<string, string>)[] }>,
    decoratorToVerify = 'Expose',
  ): boolean {
    return imports.some(({ destruct }) =>
      destruct?.some((d) =>
        typeof d === 'string'
          ? d === decoratorToVerify
          : Object.values(d).includes(decoratorToVerify),
      ),
    );
  }

  private addImport(
    imports: ImportStatementParams[],
    from: string,
    destruct: (string | Record<string, string>)[],
  ): void {
    const existingImport = imports.find((imp) => imp.from === from);
    if (existingImport) {
      existingImport.destruct?.push(...destruct);
    } else {
      imports.push({ from, destruct });
    }
  }

  processFields(
    model: Model,
    allModels: Model[],
    config: FieldProcessingConfig,
    addExposePropertyDecorator: boolean,
    customDecoratorConfigsPath?: string,
  ): FieldProcessingResult {
    let hasEnum = false;
    const imports: ImportStatementParams[] = [];
    const apiExtraModels: string[] = [];
    const extraClasses: string[] = [];

    const relationScalarFields = Helpers.getRelationScalars(model.fields);
    const relationScalarFieldNames = Object.keys(relationScalarFields);

    const fields = model.fields.reduce((result, field) => {
      const { name } = field;
      const overrides = config.getFieldOverrides(field);

      if (config.fieldFilters.shouldSkipField(field)) {
        return result;
      }

      if (this.isRelationField(field)) {
        const relationResult = this.processRelationField(
          field,
          model,
          allModels,
          config,
          addExposePropertyDecorator,
          overrides,
        );

        if (!relationResult) return result;

        Helpers.concatIntoArray(relationResult.imports, imports);
        Helpers.concatIntoArray(relationResult.extraClasses, extraClasses);
        Helpers.concatIntoArray(relationResult.apiExtraModels, apiExtraModels);

        Object.assign(overrides, relationResult.overrides);
      }

      if (relationScalarFieldNames.includes(name)) {
        return result;
      }

      if (
        config.optionalAnnotation &&
        config.fieldFilters.shouldProcessOptional
      ) {
        this.processOptionalField(field, config, overrides);
      }

      if (field.kind === 'enum') {
        hasEnum = true;
      }

      const decoratorImports = this.processCustomDecorators(
        field,
        customDecoratorConfigsPath,
      );
      imports.push(...decoratorImports);

      if (addExposePropertyDecorator && !this.hasImport(imports)) {
        this.addImport(imports, 'class-transformer', ['Expose']);
      }

      return [...result, Helpers.mapDMMFToParsedField(field, overrides)];
    }, [] as ParsedField[]);

    return {
      fields,
      imports,
      extraClasses,
      apiExtraModels,
      hasEnum,
    };
  }

  private isRelationField(field: DMMF.Field): boolean {
    return field.kind === 'object';
  }

  private processRelationField(
    field: DMMF.Field,
    model: Model,
    allModels: Model[],
    config: FieldProcessingConfig,
    addExposePropertyDecorator: boolean,
    overrides: Partial<DMMF.Field>,
  ): {
    imports: ImportStatementParams[];
    extraClasses: string[];
    apiExtraModels: string[];
    overrides: Partial<DMMF.Field>;
  } | null {
    if (!isAnnotatedWithOneOf(field, config.relationModifiers)) {
      return null;
    }

    const relationInputType = this.helpers.generateRelationInput({
      field,
      model,
      allModels,
      templateHelpers: this.templateHelpers,
      preAndSuffixClassName: config.dtoNameGenerator,
      canCreateAnnotation: config.canCreateAnnotation,
      canConnectAnnotation: config.canConnectAnnotation,
      addExposePropertyDecorator,
    });

    return {
      imports: relationInputType.imports,
      extraClasses: relationInputType.generatedClasses,
      apiExtraModels: relationInputType.apiExtraModels,
      overrides: {
        ...overrides,
        type: relationInputType.type,
        isList: false,
      },
    };
  }

  private processOptionalField(
    field: DMMF.Field,
    config: FieldProcessingConfig,
    overrides: Partial<DMMF.Field>,
  ): void {
    if (
      !config.optionalAnnotation ||
      !config.fieldFilters.shouldProcessOptional
    ) {
      return;
    }

    const isDtoOptional = isAnnotatedWith(field, config.optionalAnnotation);

    if (isDtoOptional) {
      overrides.isRequired = false;
    } else if (config.fieldFilters.shouldProcessOptional(field)) {
      overrides.isRequired = config.fieldFilters.shouldProcessOptional(field);
    }
  }

  private processCustomDecorators(
    field: DMMF.Field,
    customDecoratorConfigsPath?: string,
  ): ImportStatementParams[] {
    const decoratorStrategy = new DecoratorStrategy(customDecoratorConfigsPath);

    const decorators =
      decoratorStrategy.formatValidDecoratorResultToFromDestruct(
        decoratorStrategy.getValidDecoratorAndImportsByDoc(
          field?.documentation,
        ),
      );

    return decorators;
  }
}
