import { DecoratorStrategy } from './decorator-strategy';
import { ImportStatementParams, ParsedField } from './types';

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

export class TemplateHelpers {
  private readonly connectDtoPrefix: string;
  private readonly createDtoPrefix: string;
  private readonly updateDtoPrefix: string;
  private readonly dtoSuffix: string;
  private readonly entityPrefix: string;
  private readonly entitySuffix: string;
  public readonly transformClassNameCase: (input: string) => string;
  public readonly transformFileNameCase: (input: string) => string;
  private readonly decoratorStrategy = new DecoratorStrategy();

  static readonly PrismaScalarToTypeScript: Record<string, string> = {
    String: 'string',
    Boolean: 'boolean',
    Int: 'number',
    BigInt: 'bigint',
    Float: 'number',
    Decimal: 'Prisma.Decimal',
    DateTime: 'Date',
    Json: 'Prisma.JsonValue',
    Bytes: 'Buffer',
  };

  static readonly knownPrismaScalarTypes: string[] = Object.keys(
    TemplateHelpers.PrismaScalarToTypeScript,
  );

  constructor(options: TemplateHelpersOptions) {
    const {
      connectDtoPrefix,
      createDtoPrefix,
      updateDtoPrefix,
      dtoSuffix,
      entityPrefix,
      entitySuffix,
      transformClassNameCase = (s) => s,
      transformFileNameCase = (s) => s,
    } = options;

    this.connectDtoPrefix = connectDtoPrefix;
    this.createDtoPrefix = createDtoPrefix;
    this.updateDtoPrefix = updateDtoPrefix;
    this.dtoSuffix = dtoSuffix;
    this.entityPrefix = entityPrefix;
    this.entitySuffix = entitySuffix;
    this.transformClassNameCase = transformClassNameCase;
    this.transformFileNameCase = transformFileNameCase;
  }

  // ---- Static Helpers ----

  static scalarToTS(scalar: string, useInputTypes = false): string {
    if (!TemplateHelpers.knownPrismaScalarTypes.includes(scalar)) {
      throw new Error(`Unrecognized scalar type: ${scalar}`);
    }
    if (useInputTypes && scalar === 'Json') {
      return 'Prisma.InputJsonValue';
    }
    return TemplateHelpers.PrismaScalarToTypeScript[scalar];
  }

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

  static importStatement(input: ImportStatementParams): string {
    const { from, destruct = [], default: def } = input;
    const parts: string[] = ['import'];

    if (def) {
      parts.push(typeof def === 'string' ? def : `* as ${def['*']}`);
    }

    if (destruct.length) {
      if (def) parts.push(',');
      const inside = destruct
        .flatMap((item) =>
          typeof item === 'string'
            ? [item]
            : Object.entries(item).map(
                ([orig, alias]) => `${orig} as ${alias}`,
              ),
        )
        .join(', ');
      parts.push(`{ ${inside} }`);
    }

    parts.push(`from '${from}'`);
    return parts.join(' ');
  }

  static importStatements(items: ImportStatementParams[]): string {
    return TemplateHelpers.each(items, TemplateHelpers.importStatement, '\n');
  }

  // ---- Instance Helpers ----

  private className(name: string, prefix = '', suffix = ''): string {
    return `${prefix}${this.transformClassNameCase(name)}${suffix}`;
  }

  private fileName(
    name: string,
    prefix = '',
    suffix = '',
    withExt = false,
  ): string {
    return `${prefix}${this.transformFileNameCase(
      name,
    )}${suffix}${TemplateHelpers.when(withExt, '.ts')}`;
  }

  entityName(name: string): string {
    return this.className(name, this.entityPrefix, this.entitySuffix);
  }

  connectDtoName(name: string): string {
    return this.className(name, this.connectDtoPrefix, this.dtoSuffix);
  }

  createDtoName(name: string): string {
    return this.className(name, this.createDtoPrefix, this.dtoSuffix);
  }

  updateDtoName(name: string): string {
    return this.className(name, this.updateDtoPrefix, this.dtoSuffix);
  }

  connectDtoFilename(name: string, withExt = false): string {
    return this.fileName(name, 'connect-', '.dto', withExt);
  }

  createDtoFilename(name: string, withExt = false): string {
    return this.fileName(name, 'create-', '.dto', withExt);
  }

  updateDtoFilename(name: string, withExt = false): string {
    return this.fileName(name, 'update-', '.dto', withExt);
  }

  entityFilename(name: string, withExt = false): string {
    return this.fileName(name, undefined, '.entity', withExt);
  }

  fieldType(field: ParsedField, toInputType = false): string {
    switch (field.kind) {
      case 'scalar':
        return TemplateHelpers.scalarToTS(field.type, toInputType);
      case 'enum':
      case 'relation-input':
        return field.type;
      default:
        return `${this.entityName(field.type)}${TemplateHelpers.when(
          field.isList,
          '[]',
        )}`;
    }
  }

  static hasSomeApiPropertyDoc(fields: ParsedField[]): boolean {
    return fields.some((f) => TemplateHelpers.hasApiPropertyDoc(f));
  }

  static hasApiPropertyDoc(field: ParsedField): boolean {
    return Boolean(field.documentation?.includes('@ApiProperty'));
  }

  private addDecorator(field: ParsedField, isEntity: boolean = false): string {
    return isEntity
      ? this.buildEntityDecorator(field)
      : this.buildDtoDecorator(field);
  }

  private buildEntityDecorator(field: ParsedField): string {
    if (!TemplateHelpers.hasApiPropertyDoc(field)) {
      return '';
    }
    const apiPropertyLines = (field.documentation ?? '')
      .split('\n')
      .filter((line) => line.includes('@ApiProperty'))
      .map((line) => line.trim());
    return apiPropertyLines.join('\n') + (apiPropertyLines.length ? '\n' : '');
  }

  private buildDtoDecorator(field: ParsedField): string {
    if (field.kind === 'enum') {
      return this.buildEnumDecorator(field);
    }
    if (['scalar', 'relation-input', 'object'].includes(field.kind)) {
      return this.buildFieldDecorator(field);
    }
    return '';
  }

  private buildEnumDecorator(field: ParsedField): string {
    const isValid = this.decoratorStrategy.verifyIfDecoratorIsValid(
      field.documentation ?? '',
    );
    return isValid
      ? `${field.documentation}\n`
      : `@ApiProperty({ enum: ${this.fieldType(field)} })\n`;
  }

  private buildFieldDecorator(field: ParsedField): string {
    const isValid = this.decoratorStrategy.verifyIfDecoratorIsValid(
      field.documentation ?? '',
    );
    return isValid ? `${field.documentation}\n` : '';
  }

  fieldToDtoProp(
    field: ParsedField,
    useInputTypes = false,
    forceOptional = false,
    addExposePropertyDecorator = false,
  ): string {
    const optionalMark = TemplateHelpers.unless(
      field.isRequired && !forceOptional,
      '?',
    );

    return (
      this.addDecorator(field) +
      (addExposePropertyDecorator ? `@Expose()\n` : '') +
      `${field.name}${optionalMark}: ${this.fieldType(field, useInputTypes)};`
    );
  }

  fieldsToDtoProps(
    fields: ParsedField[],
    useInputTypes = false,
    forceOptional = false,
    addExposePropertyDecorator = false,
  ): string {
    return TemplateHelpers.each(
      fields,
      (f) =>
        this.fieldToDtoProp(
          f,
          useInputTypes,
          forceOptional,
          addExposePropertyDecorator,
        ),
      '\n',
    );
  }

  fieldToEntityProp(field: ParsedField): string {
    const opt = TemplateHelpers.unless(field.isRequired, '?');
    const nullable = TemplateHelpers.when(field.isNullable, ' | null');
    return (
      this.addDecorator(field, true) +
      `${field.name}${opt}: ${this.fieldType(field)}${nullable};`
    );
  }

  fieldsToEntityProps(fields: ParsedField[]): string {
    return TemplateHelpers.each(fields, (f) => this.fieldToEntityProp(f), '\n');
  }

  apiExtraModels(names: string[]): string {
    const list = names.map((n) => this.entityName(n)).join(', ');
    return `@ApiExtraModels(${list})`;
  }

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
    } = this;
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
