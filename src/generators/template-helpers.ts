import { ImportStatementGenerator } from './template-helpers/import-generator';
import { DefaultNamingStrategy } from './template-helpers/naming-strategy';
import { PropertyRenderer } from './template-helpers/property-renderer';
import { TemplateUtilities } from './template-helpers/template-utilities';
import { PrismaTypeConverter } from './template-helpers/type-converter';
import {
  TypeProvider,
  EntityNameProvider,
} from './template-helpers/interfaces';
import { ParsedField } from './types';

export interface TemplateHelpersOptions {
  connectDtoPrefix: string;
  createDtoPrefix: string;
  updateDtoPrefix: string;
  dtoSuffix: string;
  entityPrefix: string;
  entitySuffix: string;
  decoratorConfigPath?: string;
  transformClassNameCase?: (input: string) => string;
  transformFileNameCase?: (input: string) => string;
}

export class TemplateHelpers implements TypeProvider, EntityNameProvider {
  private readonly namingStrategy: DefaultNamingStrategy;
  private readonly typeConverter: PrismaTypeConverter;
  private readonly propertyRenderer: PropertyRenderer;
  private readonly templateUtilities: TemplateUtilities;

  constructor(private readonly options: TemplateHelpersOptions) {
    this.namingStrategy = new DefaultNamingStrategy(
      options.transformClassNameCase || ((s) => s),
      options.transformFileNameCase || ((s) => s),
    );
    this.typeConverter = new PrismaTypeConverter();
    this.propertyRenderer = new PropertyRenderer(
      this,
      options.decoratorConfigPath,
    );
    this.templateUtilities = new TemplateUtilities(options.decoratorConfigPath);
  }

  // === Naming Methods ===
  entityName(name: string, ignorePrefixAndSufix = false): string {
    return this.namingStrategy.transformClassName(
      name,
      ignorePrefixAndSufix ? '' : this.options.entityPrefix,
      ignorePrefixAndSufix ? '' : this.options.entitySuffix,
    );
  }

  connectDtoName(name: string): string {
    return this.namingStrategy.transformClassName(
      name,
      this.options.connectDtoPrefix,
      this.options.dtoSuffix,
    );
  }

  createDtoName(name: string): string {
    return this.namingStrategy.transformClassName(
      name,
      this.options.createDtoPrefix,
      this.options.dtoSuffix,
    );
  }

  updateDtoName(name: string): string {
    return this.namingStrategy.transformClassName(
      name,
      this.options.updateDtoPrefix,
      this.options.dtoSuffix,
    );
  }

  // === File Naming Methods ===
  connectDtoFilename(name: string, withExt = false): string {
    return this.namingStrategy.transformFileName(
      name,
      'connect-',
      '.dto',
      withExt,
    );
  }

  createDtoFilename(name: string, withExt = false): string {
    return this.namingStrategy.transformFileName(
      name,
      'create-',
      '.dto',
      withExt,
    );
  }

  updateDtoFilename(name: string, withExt = false): string {
    return this.namingStrategy.transformFileName(
      name,
      'update-',
      '.dto',
      withExt,
    );
  }

  entityFilename(name: string, withExt = false): string {
    return this.namingStrategy.transformFileName(
      name,
      undefined,
      '.entity',
      withExt,
    );
  }

  // === Type Methods ===
  fieldType(
    field: ParsedField,
    toInputType = false,
    entityPrefix = '',
    entitySuffix = '',
  ): string {
    return this.typeConverter.fieldType(
      field,
      toInputType,
      entityPrefix,
      entitySuffix,
    );
  }

  // === Property Rendering Methods ===
  fieldsToDtoProps(
    fields: ParsedField[],
    useInputTypes = false,
    forceOptional = false,
    addExposePropertyDecorator = false,
  ): string {
    return this.propertyRenderer.fieldsToDtoProps(
      fields,
      useInputTypes,
      forceOptional,
      addExposePropertyDecorator,
    );
  }

  fieldsToEntityProps(
    fields: ParsedField[],
    entityPrefix = '',
    entitySuffix = '',
  ): string {
    return this.propertyRenderer.fieldsToEntityProps(
      fields,
      entityPrefix,
      entitySuffix,
    );
  }

  // === Static Utility Methods ===
  static echo(input: string): string {
    return input;
  }

  static when(condition: unknown, thenTpl: string, elseTpl = ''): string {
    return condition ? thenTpl : elseTpl;
  }

  static unless(condition: unknown, thenTpl: string, elseTpl = ''): string {
    return !condition ? thenTpl : elseTpl;
  }

  static each<T>(arr: T[], fn: (item: T) => string, joinWith = ''): string {
    return arr.map(fn).join(joinWith);
  }

  static hasSomeApiPropertyDoc(
    fields: ParsedField[],
    decoratorConfigPath?: string,
  ): boolean {
    const tempUtils = new TemplateUtilities(decoratorConfigPath);
    return tempUtils.hasSomeApiPropertyDoc(fields);
  }

  static hasApiPropertyDoc(
    field: ParsedField,
    decoratorConfigPath?: string,
  ): boolean {
    const tempUtils = new TemplateUtilities(decoratorConfigPath);
    return tempUtils.hasApiPropertyDoc(field);
  }

  static importStatement = ImportStatementGenerator.importStatement;
  static importStatements = ImportStatementGenerator.importStatements;

  // Type conversion static methods
  static scalarToTS(scalar: string, useInputTypes = false): string {
    const converter = new PrismaTypeConverter();
    return converter.scalarToTS(scalar, useInputTypes);
  }

  // === API Extra Models ===
  apiExtraModels(names: string[], ignorePrefixAndSufix = false): string {
    const list = names
      .map((n) => this.entityName(n, ignorePrefixAndSufix))
      .join(', ');
    return `@ApiExtraModels(${list})`;
  }

  // === Transformation Methods ===
  get transformClassNameCase(): (input: string) => string {
    return this.options.transformClassNameCase || ((s) => s);
  }

  get transformFileNameCase(): (input: string) => string {
    return this.options.transformFileNameCase || ((s) => s);
  }

  // === Configuration ===
  get config(): Omit<
    TemplateHelpersOptions,
    'transformClassNameCase' | 'transformFileNameCase'
  > {
    const {
      connectDtoPrefix,
      createDtoPrefix,
      updateDtoPrefix,
      dtoSuffix,
      entityPrefix,
      entitySuffix,
    } = this.options;

    return {
      connectDtoPrefix,
      createDtoPrefix,
      updateDtoPrefix,
      dtoSuffix,
      entityPrefix,
      entitySuffix,
    };
  }
}
