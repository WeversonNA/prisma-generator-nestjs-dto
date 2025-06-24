import { DecoratorStrategy } from '../decorators/decorator-strategy';
import { ParsedField } from '../types';
import { PrismaTypeConverter } from './type-converter';

export class TemplateUtilities {
  private decoratorStrategy: DecoratorStrategy;
  private prismaTypeConverter = new PrismaTypeConverter();

  constructor(decoratorConfigPath?: string) {
    this.decoratorStrategy = new DecoratorStrategy(decoratorConfigPath);
  }

  echo(input: string): string {
    return input;
  }

  when(condition: unknown, thenTpl: string, elseTpl = ''): string {
    return condition ? thenTpl : elseTpl;
  }

  unless(condition: unknown, thenTpl: string, elseTpl = ''): string {
    return !condition ? thenTpl : elseTpl;
  }

  each<T>(arr: T[], fn: (item: T) => string, joinWith = ''): string {
    return arr.map(fn).join(joinWith);
  }

  hasApiPropertyDoc(field: ParsedField): boolean {
    return Boolean(field.documentation?.includes('@ApiProperty'));
  }

  hasSomeApiPropertyDoc(fields: ParsedField[]): boolean {
    return fields.some((f) => this.hasApiPropertyDoc(f));
  }

  buildEntityDecorator(field: ParsedField): string {
    if (!this.hasApiPropertyDoc(field)) {
      return '';
    }
    const apiPropertyLines = (field.documentation ?? '')
      .split('\n')
      .filter((line) => line.includes('@ApiProperty'))
      .map((line) => line.trim());
    return apiPropertyLines.join('\n') + (apiPropertyLines.length ? '' : '');
  }

  buildDtoDecorator(field: ParsedField): string {
    if (field.kind === 'enum') {
      return this.buildEnumDecorator(field);
    }

    if (['scalar', 'relation-input', 'object'].includes(field.kind)) {
      return this.buildFieldDecorator(field);
    }
    return '';
  }

  buildEnumDecorator(field: ParsedField): string {
    const isValid = this.decoratorStrategy.verifyIfDecoratorIsValid(
      field.documentation ?? '',
    );
    return isValid
      ? `${field.documentation}\n`
      : `@ApiProperty({ enum: ${this.prismaTypeConverter.fieldType(field)} })\n`;
  }

  buildFieldDecorator(field: ParsedField): string {
    const decorators = this.decoratorStrategy.getValidDecorators(
      field.documentation ?? '',
    );

    return decorators?.length ? `${decorators.join('\n')}` : '';
  }
}
