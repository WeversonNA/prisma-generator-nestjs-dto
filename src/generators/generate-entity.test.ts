import { generateEntity } from './generate-entity';
import { TemplateHelpers } from './helpers/template-helpers';
import type { DMMF } from '@prisma/generator-helper';
import type { ParsedField, ImportStatementParams } from './types';

describe('generateEntity', () => {
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

  it('should generate basic entity without imports or api extra models', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
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

    const result = generateEntity({
      model: mockModel,
      fields,
      imports: [],
      apiExtraModels: [],
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class User');
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('email');
  });

  it('should include imports when provided', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
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

    const result = generateEntity({
      model: mockModel,
      fields,
      imports,
      apiExtraModels: [],
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain("import { UserRole } from '@prisma/client'");
    expect(result).toContain('export class User');
  });

  it('should include ApiExtraModels decorator when apiExtraModels provided', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const apiExtraModels = ['UserProfile', 'UserSettings'];

    const result = generateEntity({
      model: mockModel,
      fields,
      imports: [],
      apiExtraModels,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('@ApiExtraModels(UserProfile, UserSettings)');
    expect(result).toContain('export class User');
  });

  it('should handle empty fields array', () => {
    const result = generateEntity({
      model: mockModel,
      fields: [],
      imports: [],
      apiExtraModels: [],
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class User');
    expect(result).toContain('{\n  \n}');
  });

  it('should use entity prefix and suffix from template helpers configuration', () => {
    const customTemplateHelpers = new TemplateHelpers({
      connectDtoPrefix: 'Connect',
      createDtoPrefix: 'Create',
      updateDtoPrefix: 'Update',
      dtoSuffix: 'Dto',
      entityPrefix: 'Entity',
      entitySuffix: 'Model',
    });

    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const result = generateEntity({
      model: mockModel,
      fields,
      imports: [],
      apiExtraModels: [],
      templateHelpers: customTemplateHelpers,
    });

    expect(result).toContain('export class EntityUserModel');
  });

  it('should pass entityPrefix and entitySuffix to fieldsToEntityProps', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const spy = jest.spyOn(defaultTemplateHelpers, 'fieldsToEntityProps');

    generateEntity({
      model: mockModel,
      fields,
      imports: [],
      apiExtraModels: [],
      templateHelpers: defaultTemplateHelpers,
      entityPrefix: 'Custom',
      entitySuffix: 'Entity',
    });

    expect(spy).toHaveBeenCalledWith(fields, 'Custom', 'Entity');

    spy.mockRestore();
  });

  it('should handle multiple import statements', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'role',
        type: 'UserRole',
        kind: 'enum',
        isRequired: true,
      }),
      createMockField({
        name: 'createdAt',
        type: 'DateTime',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const imports: ImportStatementParams[] = [
      {
        from: '@prisma/client',
        destruct: ['UserRole'],
      },
      {
        from: './decorators',
        destruct: ['ApiProperty'],
      },
    ];

    const result = generateEntity({
      model: mockModel,
      fields,
      imports,
      apiExtraModels: [],
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain("import { UserRole } from '@prisma/client'");
    expect(result).toContain("import { ApiProperty } from './decorators'");
    expect(result).toContain('export class User');
  });

  it('should handle relation fields', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
      createMockField({
        name: 'posts',
        type: 'Post',
        kind: 'object',
        isList: true,
        isRequired: false,
      }),
      createMockField({
        name: 'profile',
        type: 'Profile',
        kind: 'object',
        isRequired: false,
      }),
    ];

    const result = generateEntity({
      model: mockModel,
      fields,
      imports: [],
      apiExtraModels: [],
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class User');
    expect(result).toContain('id');
    expect(result).toContain('posts');
    expect(result).toContain('profile');
  });

  it('should handle fields with nullable property', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
      createMockField({
        name: 'middleName',
        type: 'String',
        kind: 'scalar',
        isRequired: false,
        isNullable: true,
      }),
    ];

    const result = generateEntity({
      model: mockModel,
      fields,
      imports: [],
      apiExtraModels: [],
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain('export class User');
    expect(result).toContain('id');
    expect(result).toContain('middleName');
  });

  it('should handle complex model with various field types', () => {
    const fields: ParsedField[] = [
      createMockField({
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
      }),
      createMockField({
        name: 'email',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
      }),
      createMockField({
        name: 'role',
        type: 'UserRole',
        kind: 'enum',
        isRequired: true,
      }),
      createMockField({
        name: 'posts',
        type: 'Post',
        kind: 'object',
        isList: true,
        isRequired: false,
      }),
      createMockField({
        name: 'createdAt',
        type: 'DateTime',
        kind: 'scalar',
        isRequired: true,
      }),
      createMockField({
        name: 'updatedAt',
        type: 'DateTime',
        kind: 'scalar',
        isRequired: true,
      }),
    ];

    const imports: ImportStatementParams[] = [
      {
        from: '@prisma/client',
        destruct: ['UserRole'],
      },
    ];

    const apiExtraModels = ['Post'];

    const result = generateEntity({
      model: mockModel,
      fields,
      imports,
      apiExtraModels,
      templateHelpers: defaultTemplateHelpers,
    });

    expect(result).toContain("import { UserRole } from '@prisma/client'");
    expect(result).toContain('@ApiExtraModels(Post)');
    expect(result).toContain('export class User');
    expect(result).toContain('id');
    expect(result).toContain('email');
    expect(result).toContain('role');
    expect(result).toContain('posts');
    expect(result).toContain('createdAt');
    expect(result).toContain('updatedAt');
  });
});
