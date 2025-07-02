import type { ParsedField } from '../types';
import { TemplateUtilities } from './template-utilities';
import type { TypeProvider } from './interfaces';

export class PropertyRenderer {
  private templateUtilities: TemplateUtilities;

  constructor(
    private readonly typeProvider: TypeProvider,
    decoratorConfigPath?: string,
  ) {
    this.templateUtilities = new TemplateUtilities(decoratorConfigPath);
  }

  addDecorator(field: ParsedField, forEntity = false): string {
    return forEntity
      ? this.templateUtilities.buildEntityDecorator(field)
      : this.templateUtilities.buildDtoDecorator(field);
  }

  fieldToDtoProp(
    field: ParsedField,
    useInputTypes = false,
    forceOptional = false,
    addExposePropertyDecorator = false,
  ): string {
    const optionalMark = this.templateUtilities.unless(
      forceOptional ? false : field.isRequired,
      '?',
    );

    const decorator = this.addDecorator(field);
    const decoratorWithNewline = decorator ? decorator + '\n' : '';

    return (
      `  // @generated from prisma schema\n` +
      decoratorWithNewline +
      (addExposePropertyDecorator ? `  @Expose()\n` : '') +
      `  ${field.name}${optionalMark}: ${this.getFieldType(field, useInputTypes)};`
    );
  }

  fieldToEntityProp(
    field: ParsedField,
    entityPrefix = '',
    entitySuffix = '',
  ): string {
    const opt = this.templateUtilities.unless(field.isRequired, '?');
    const nullable = this.templateUtilities.when(field.isNullable, ' | null');

    const decorator = this.addDecorator(field, true);
    const decoratorWithNewline = decorator ? decorator + '\n' : '';

    const type = this.getFieldType(field, false, entityPrefix, entitySuffix);

    return (
      `  // @generated from prisma schema\n` +
      decoratorWithNewline +
      `  ${field.name}${opt}: ${type}${nullable};`
    );
  }

  fieldsToDtoProps(
    fields: ParsedField[],
    useInputTypes = false,
    forceOptional = false,
    addExposePropertyDecorator = false,
  ): string {
    return this.templateUtilities.each(
      fields,
      (f: ParsedField) =>
        this.fieldToDtoProp(
          f,
          useInputTypes,
          forceOptional,
          addExposePropertyDecorator,
        ),
      '\n',
    );
  }

  fieldsToEntityProps(
    fields: ParsedField[],
    entityPrefix = '',
    entitySuffix = '',
  ): string {
    return this.templateUtilities.each(
      fields,
      (f: ParsedField) => this.fieldToEntityProp(f, entityPrefix, entitySuffix),
      '\n',
    );
  }

  private getFieldType(
    field: ParsedField,
    toInputType = false,
    entityPrefix = '',
    entitySuffix = '',
  ): string {
    return this.typeProvider.fieldType(
      field,
      toInputType,
      entityPrefix,
      entitySuffix,
    );
  }
}
