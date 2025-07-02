import { generateCreateDto } from './generate-create-dto';
import { TemplateHelpers } from './helpers/template-helpers';
import type { DMMF } from '@prisma/generator-helper';
import type { ParsedField, ImportStatementParams } from './types';

describe('generateCreateDto', () => {
  const mockModel: DMMF.Model = {
    name: 'User',
    isEmbedded: false,
    dbName: null,
    fields: [],
    uniqueFields: [],
    uniqueIndexes: [],
    documentation: '',
    idFields: [],
  };

  const defaultTemplateHelpers = new TemplateHelpers({
    connectDtoPrefix: 'Connect',
    createDtoPrefix: 'Create',
    updateDtoPrefix: 'Update',
    dtoSuffix: 'Dto',
    entityPrefix: '',
    entitySuffix: '',
  });

  const createMockField = (
    overrides: Partial<ParsedField> = {},
  ): ParsedField => ({
    name: 'testField',
    kind: 'scalar',
    type: 'String',
    isRequired: false,
    isList: false,
    documentation: '',
    ...overrides,
  });

  it('should generate basic CreateDTO without imports or extra classes', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
      createMockField({
        name: 'email',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const result = generateCreateDto({
      model: mockModel,
      fields,
      imports: [],
      extraClasses: [],
      apiExtraModels: [],
      exportRelationModifierClasses: false,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class CreateUserDto');
    expect(result).toContain('name');
    expect(result).toContain('email');
  });

  it('should include imports when provided', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'role',
        type: 'UserRole',
        kind: 'enum',
        isRequired: true,
      }),
    ];

    const imports: ImportStatementParams[] = [
      {
        from: '@prisma/client',
        destruct: ['UserRole'],
      },
    ];

    const result = generateCreateDto({
      model: mockModel,
      fields,
      imports,
      extraClasses: [],
      apiExtraModels: [],
      exportRelationModifierClasses: false,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain("import { UserRole } from '@prisma/client'");
    expect(result).toContain('export class CreateUserDto');
  });

  it('should include extra classes when provided and export enabled', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const extraClasses = [
      'class NestedClass { id: number; }',
      'interface HelperInterface { name: string; }',
    ];

    const result = generateCreateDto({
      model: mockModel,
      fields,
      imports: [],
      extraClasses,
      apiExtraModels: [],
      exportRelationModifierClasses: true,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class NestedClass { id: number; }');
    expect(result).toContain(
      'export interface HelperInterface { name: string; }',
    );
  });

  it('should include extra classes without export when disabled', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const extraClasses = ['class NestedClass { id: number; }'];

    const result = generateCreateDto({
      model: mockModel,
      fields,
      imports: [],
      extraClasses,
      apiExtraModels: [],
      exportRelationModifierClasses: false,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('class NestedClass { id: number; }');
    expect(result).not.toContain('export class NestedClass');
  });

  it('should include ApiExtraModels decorator when apiExtraModels provided', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const apiExtraModels = ['UserProfile', 'UserSettings'];

    const result = generateCreateDto({
      model: mockModel,
      fields,
      imports: [],
      extraClasses: [],
      apiExtraModels,
      exportRelationModifierClasses: false,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('@ApiExtraModels(UserProfile, UserSettings)');
    expect(result).toContain('export class CreateUserDto');
  });

  it('should handle empty fields array', () => {
    const result = generateCreateDto({
      model: mockModel,
      fields: [],
      imports: [],
      extraClasses: [],
      apiExtraModels: [],
      exportRelationModifierClasses: false,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class CreateUserDto');
    expect(result).toContain('{\n  \n}');
  });

  it('should use custom template helpers configuration', () => {
    const customTemplateHelpers = new TemplateHelpers({
      connectDtoPrefix: 'Connect',
      createDtoPrefix: 'New',
      updateDtoPrefix: 'Update',
      dtoSuffix: 'Input',
      entityPrefix: '',
      entitySuffix: '',
    });

    const fields: ParsedField[] = [
      createMockField({
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const result = generateCreateDto({
      model: mockModel,
      fields,
      imports: [],
      extraClasses: [],
      apiExtraModels: [],
      exportRelationModifierClasses: false,
      templateHelpers: customTemplateHelpers,
    });

    expect(result).toContain('export class NewUserInput');
  });

  it('should handle relation input fields', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
      createMockField({
        name: 'profile',
        type: 'ProfileCreateInput',
        kind: 'relation-input',
        isRequired: false,
      }),
    ];

    const result = generateCreateDto({
      model: mockModel,
      fields,
      imports: [],
      extraClasses: [],
      apiExtraModels: [],
      exportRelationModifierClasses: false,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class CreateUserDto');
    expect(result).toContain('name');
    expect(result).toContain('profile');
  });

  it('should pass addExposePropertyDecorator to fieldsToDtoProps', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const spy = jest.spyOn(defaultTemplateHelpers, 'fieldsToDtoProps');

    generateCreateDto({
      model: mockModel,
      fields,
      imports: [],
      extraClasses: [],
      apiExtraModels: [],
      exportRelationModifierClasses: false,
      templateHelpers: defaultTemplateHelpers,
      addExposePropertyDecorator: true,
    });

    expect(spy).toHaveBeenCalledWith(fields, true, false, true);

    spy.mockRestore();
  });
});
