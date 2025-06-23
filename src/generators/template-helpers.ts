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
  transformClassNameCase?: (input: string) => string;
  transformFileNameCase?: (input: string) => string;
}

export class TemplateHelpers implements TypeProvider, EntityNameProvider {
  private readonly namingStrategy: DefaultNamingStrategy;
  private readonly typeConverter: PrismaTypeConverter;
  private readonly propertyRenderer: PropertyRenderer;

  constructor(private readonly options: TemplateHelpersOptions) {
    this.namingStrategy = new DefaultNamingStrategy(
      options.transformClassNameCase || ((s) => s),
      options.transformFileNameCase || ((s) => s),
    );
    this.typeConverter = new PrismaTypeConverter();
    this.propertyRenderer = new PropertyRenderer(this);
  }

  // === Naming Methods ===
  entityName(name: string): string {
    return this.namingStrategy.transformClassName(
      name,
      this.options.entityPrefix,
      this.options.entitySuffix,
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
  fieldType(field: ParsedField, toInputType = false): string {
    return this.typeConverter.fieldType(field, toInputType);
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

  fieldsToEntityProps(fields: ParsedField[]): string {
    return this.propertyRenderer.fieldsToEntityProps(fields);
  }

  // === Static Utility Methods ===
  static echo = TemplateUtilities.echo;
  static when = TemplateUtilities.when;
  static unless = TemplateUtilities.unless;
  static each = TemplateUtilities.each;
  static hasSomeApiPropertyDoc = TemplateUtilities.hasSomeApiPropertyDoc;
  static hasApiPropertyDoc = TemplateUtilities.hasApiPropertyDoc;

  static importStatement = ImportStatementGenerator.importStatement;
  static importStatements = ImportStatementGenerator.importStatements;

  // Type conversion static methods
  static scalarToTS(scalar: string, useInputTypes = false): string {
    const converter = new PrismaTypeConverter();
    return converter.scalarToTS(scalar, useInputTypes);
  }

  // === API Extra Models ===
  apiExtraModels(names: string[]): string {
    const list = names.map((n) => this.entityName(n)).join(', ');
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
