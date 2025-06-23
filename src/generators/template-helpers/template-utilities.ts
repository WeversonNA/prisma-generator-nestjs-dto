import { DecoratorStrategy } from '../decorator-strategy';
import { ParsedField } from '../types';
import { PrismaTypeConverter } from './type-converter';

export class TemplateUtilities {
  private static prismaTypeConverter = new PrismaTypeConverter();
  private static decoratorStrategy = new DecoratorStrategy();
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

  static hasApiPropertyDoc(field: ParsedField): boolean {
    return Boolean(field.documentation?.includes('@ApiProperty'));
  }

  static hasSomeApiPropertyDoc(fields: ParsedField[]): boolean {
    return fields.some((f) => TemplateUtilities.hasApiPropertyDoc(f));
  }

  static buildEntityDecorator(field: ParsedField): string {
    if (!TemplateUtilities.hasApiPropertyDoc(field)) {
      return '';
    }
    const apiPropertyLines = (field.documentation ?? '')
      .split('\n')
      .filter((line) => line.includes('@ApiProperty'))
      .map((line) => line.trim());
    return apiPropertyLines.join('\n') + (apiPropertyLines.length ? '' : '');
  }

  static buildDtoDecorator(field: ParsedField): string {
    if (field.kind === 'enum') {
      return this.buildEnumDecorator(field);
    }

    if (['scalar', 'relation-input', 'object'].includes(field.kind)) {
      return this.buildFieldDecorator(field);
    }
    return '';
  }

  static buildEnumDecorator(field: ParsedField): string {
    const isValid = this.decoratorStrategy.verifyIfDecoratorIsValid(
      field.documentation ?? '',
    );
    return isValid
      ? `${field.documentation}\n`
      : `@ApiProperty({ enum: ${this.prismaTypeConverter.fieldType(field)} })\n`;
  }

  static buildFieldDecorator(field: ParsedField): string {
    const decorators = this.decoratorStrategy.getValidDecorators(
      field.documentation ?? '',
    );

    return decorators?.length ? `${decorators.join('\n')}` : '';
  }
}
