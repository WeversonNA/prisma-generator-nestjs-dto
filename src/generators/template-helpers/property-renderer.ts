import { ParsedField } from '../types';
import { TemplateUtilities } from './template-utilities';
import { TypeProvider } from './interfaces';

export class PropertyRenderer {
  constructor(private readonly typeProvider: TypeProvider) {}

  addDecorator(field: ParsedField, forEntity = false): string {
    return forEntity
      ? TemplateUtilities.buildEntityDecorator(field)
      : TemplateUtilities.buildDtoDecorator(field);
  }

  fieldToDtoProp(
    field: ParsedField,
    useInputTypes = false,
    forceOptional = false,
    addExposePropertyDecorator = false,
  ): string {
    const optionalMark = TemplateUtilities.unless(
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

  fieldToEntityProp(field: ParsedField): string {
    const opt = TemplateUtilities.unless(field.isRequired, '?');
    const nullable = TemplateUtilities.when(field.isNullable, ' | null');

    const decorator = this.addDecorator(field, true);
    const decoratorWithNewline = decorator ? decorator + '\n' : '';

    return (
      `  // @generated from prisma schema\n` +
      decoratorWithNewline +
      `  ${field.name}${opt}: ${this.getFieldType(field)}${nullable};`
    );
  }

  fieldsToDtoProps(
    fields: ParsedField[],
    useInputTypes = false,
    forceOptional = false,
    addExposePropertyDecorator = false,
  ): string {
    return TemplateUtilities.each(
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

  fieldsToEntityProps(fields: ParsedField[]): string {
    return TemplateUtilities.each(
      fields,
      (f) => this.fieldToEntityProp(f),
      '\n',
    );
  }

  private getFieldType(field: ParsedField, toInputType = false): string {
    return this.typeProvider.fieldType(field, toInputType);
  }
}
