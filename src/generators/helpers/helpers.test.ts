import { Helpers } from '../helpers/helpers';
import type { DMMF } from '@prisma/generator-helper';
import type { ParsedField, ImportStatementParams } from '../types';

describe('Helpers', () => {
  const createMockField = (
    overrides: Partial<DMMF.Field> = {},
  ): DMMF.Field => ({
    name: 'testField',
    kind: 'scalar',
    type: 'String',
    isRequired: false,
    isUnique: false,
    isUpdatedAt: false,
    isList: false,
    isId: false,
    isReadOnly: false,
    isGenerated: false,
    hasDefaultValue: false,
    documentation: '',
    ...overrides,
  });

  const createMockModel = (
    overrides: Partial<DMMF.Model> = {},
  ): DMMF.Model => ({
    name: 'TestModel',
    isEmbedded: false,
    dbName: null,
    fields: [],
    uniqueFields: [],
    uniqueIndexes: [],
    documentation: '',
    idFields: [],
    ...overrides,
  });

  describe('uniq', () => {
    it('should remove duplicates from array', () => {
      const input = [1, 2, 2, 3, 3, 3, 4];
      const result = Helpers.uniq(input);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle empty array', () => {
      const result = Helpers.uniq([]);
      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const input = [1, 2, 3, 4];
      const result = Helpers.uniq(input);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should work with strings', () => {
      const input = ['a', 'b', 'b', 'c'];
      const result = Helpers.uniq(input);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('concatIntoArray', () => {
    it('should concatenate source array into target array', () => {
      const source = [1, 2, 3];
      const target = [4, 5];

      Helpers.concatIntoArray(source, target);

      expect(target).toEqual([4, 5, 1, 2, 3]);
    });

    it('should handle empty source array', () => {
      const source: number[] = [];
      const target = [1, 2];

      Helpers.concatIntoArray(source, target);

      expect(target).toEqual([1, 2]);
    });

    it('should handle empty target array', () => {
      const source = [1, 2];
      const target: number[] = [];

      Helpers.concatIntoArray(source, target);

      expect(target).toEqual([1, 2]);
    });
  });

  describe('makeImportsFromPrismaClient', () => {
    it('should return null when no enums or Prisma types needed', () => {
      const fields: ParsedField[] = [
        { ...createMockField(), kind: 'scalar', type: 'String' },
        { ...createMockField(), kind: 'scalar', type: 'Int' },
      ];

      const result = Helpers.makeImportsFromPrismaClient(fields);
      expect(result).toBeNull();
    });

    it('should import enums when present', () => {
      const fields: ParsedField[] = [
        { ...createMockField(), kind: 'enum', type: 'UserRole' },
        { ...createMockField(), kind: 'enum', type: 'Status' },
      ];

      const result = Helpers.makeImportsFromPrismaClient(fields);
      expect(result).toEqual({
        from: '@prisma/client',
        destruct: ['UserRole', 'Status'],
      });
    });

    it('should import Prisma when needed for scalar types', () => {
      const fields: ParsedField[] = [
        { ...createMockField(), kind: 'scalar', type: 'Decimal' },
      ];

      jest.doMock('./template-helpers', () => ({
        TemplateHelpers: {
          scalarToTS: jest.fn().mockReturnValue('Prisma.Decimal'),
        },
      }));

      const result = Helpers.makeImportsFromPrismaClient(fields);
      expect(result).toBeDefined();
      expect(result?.from).toBe('@prisma/client');
      expect(result?.destruct).toContain('Prisma');

      jest.dontMock('./template-helpers');
    });

    it('should remove duplicate enums', () => {
      const fields: ParsedField[] = [
        { ...createMockField(), kind: 'enum', type: 'UserRole' },
        { ...createMockField(), kind: 'enum', type: 'UserRole' },
      ];

      const result = Helpers.makeImportsFromPrismaClient(fields);
      expect(result).toEqual({
        from: '@prisma/client',
        destruct: ['UserRole'],
      });
    });
  });

  describe('mapDMMFToParsedField', () => {
    const field: DMMF.Field = createMockField({
      name: 'testField',
      type: 'String',
      isRequired: true,
    });

    it('should map DMMF.Field to ParsedField without overrides', () => {
      const result = Helpers.mapDMMFToParsedField(field);
      expect(result).toEqual(field);
    });

    it('should apply overrides to specific properties', () => {
      const overrides = { name: 'overriddenName', isRequired: false };
      const result = Helpers.mapDMMFToParsedField(field, overrides);

      expect(result.name).toBe('overriddenName');
      expect(result.isRequired).toBe(false);
      expect(result.type).toBe('String');
    });
  });

  describe('getRelationScalars', () => {
    it('should return empty object when no relation fields', () => {
      const fields: DMMF.Field[] = [
        createMockField({ name: 'id', type: 'Int' }),
        createMockField({ name: 'name', type: 'String' }),
      ];

      const result = Helpers.getRelationScalars(fields);
      expect(result).toEqual({});
    });

    it('should map scalar fields to their related relation fields', () => {
      const fields: DMMF.Field[] = [
        createMockField({
          name: 'userId',
          type: 'Int',
          relationFromFields: ['userId'],
        }),
        createMockField({
          name: 'user',
          type: 'User',
          kind: 'object',
          relationFromFields: ['userId'],
        }),
        createMockField({
          name: 'categoryId',
          type: 'Int',
          relationFromFields: ['categoryId'],
        }),
        createMockField({
          name: 'category',
          type: 'Category',
          kind: 'object',
          relationFromFields: ['categoryId'],
        }),
      ];

      const result = Helpers.getRelationScalars(fields);
      expect(result).toEqual({
        userId: ['userId', 'user'],
        categoryId: ['categoryId', 'category'],
      });
    });
  });

  describe('getRelationConnectInputFields', () => {
    const createUserModel = (): DMMF.Model =>
      createMockModel({
        name: 'User',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'email', type: 'String', isUnique: true }),
          createMockField({ name: 'name', type: 'String' }),
        ],
      });

    it('should throw error for non-relation field', () => {
      const field = createMockField({ kind: 'scalar' });
      const allModels = [createUserModel()];

      expect(() => {
        Helpers.getRelationConnectInputFields({ field, allModels });
      }).toThrow('Not a relation field');
    });

    it('should throw error when related model not found', () => {
      const field = createMockField({
        name: 'author',
        type: 'UnknownModel',
        kind: 'object',
        relationToFields: ['id'],
      });
      const allModels = [createUserModel()];

      expect(() => {
        Helpers.getRelationConnectInputFields({ field, allModels });
      }).toThrow("Related model 'UnknownModel' unknown");
    });

    it('should throw error when relationToFields is empty', () => {
      const field = createMockField({
        name: 'author',
        type: 'User',
        kind: 'object',
        relationToFields: [],
      });
      const allModels = [createUserModel()];

      expect(() => {
        Helpers.getRelationConnectInputFields({ field, allModels });
      }).toThrow('Foreign keys are unknown');
    });

    it('should return set of connect fields including foreign keys, id, and unique fields', () => {
      const field = createMockField({
        name: 'author',
        type: 'User',
        kind: 'object',
        relationToFields: ['id'],
      });
      const allModels = [createUserModel()];

      const result = Helpers.getRelationConnectInputFields({
        field,
        allModels,
      });
      const fieldNames = Array.from(result).map((f) => f.name);

      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('email');
    });
  });

  describe('getRelativePath', () => {
    it('should return relative path between directories', () => {
      const from = '/src/modules/user/dto';
      const to = '/src/modules/post/dto';

      const result = Helpers.getRelativePath(from, to);
      expect(result).toBe('../../post/dto');
    });

    it('should return dot for same directory', () => {
      const from = '/src/dto';
      const to = '/src/dto';

      const result = Helpers.getRelativePath(from, to);
      expect(result).toBe('.');
    });

    it('should handle nested paths', () => {
      const from = '/src/modules/user/dto';
      const to = '/src/shared/types';

      const result = Helpers.getRelativePath(from, to);
      expect(result).toBe('../../../shared/types');
    });
  });

  describe('mergeImportStatements', () => {
    it('should merge import statements with same from', () => {
      const first: ImportStatementParams = {
        from: '@prisma/client',
        destruct: ['User'],
      };
      const second: ImportStatementParams = {
        from: '@prisma/client',
        destruct: ['Post'],
      };

      const result = Helpers.mergeImportStatements(first, second);
      expect(result).toEqual({
        from: '@prisma/client',
        destruct: ['User', 'Post'],
      });
    });

    it('should throw error when from differs', () => {
      const first: ImportStatementParams = {
        from: '@prisma/client',
        destruct: ['User'],
      };
      const second: ImportStatementParams = {
        from: 'other-package',
        destruct: ['Post'],
      };

      expect(() => {
        Helpers.mergeImportStatements(first, second);
      }).toThrow("Cannot merge import statements; 'from' differs");
    });

    it('should throw error when both have default imports', () => {
      const first: ImportStatementParams = {
        from: 'package',
        default: 'DefaultA',
      };
      const second: ImportStatementParams = {
        from: 'package',
        default: 'DefaultB',
      };

      expect(() => {
        Helpers.mergeImportStatements(first, second);
      }).toThrow('Cannot merge import statements; both have default');
    });

    it('should remove duplicates in destruct array', () => {
      const first: ImportStatementParams = {
        from: '@prisma/client',
        destruct: ['User', 'Post'],
      };
      const second: ImportStatementParams = {
        from: '@prisma/client',
        destruct: ['User', 'Comment'],
      };

      const result = Helpers.mergeImportStatements(first, second);
      expect(result.destruct).toEqual(['User', 'Post', 'Comment']);
    });
  });

  describe('zipImportStatementParams', () => {
    it('should group and merge import statements by from', () => {
      const items: ImportStatementParams[] = [
        { from: '@prisma/client', destruct: ['User'] },
        { from: 'lodash', destruct: ['map'] },
        { from: '@prisma/client', destruct: ['Post'] },
        { from: 'lodash', destruct: ['filter'] },
      ];

      const result = Helpers.zipImportStatementParams(items);
      expect(result).toHaveLength(2);
      expect(result.find((i) => i.from === '@prisma/client')?.destruct).toEqual(
        ['User', 'Post'],
      );
      expect(result.find((i) => i.from === 'lodash')?.destruct).toEqual([
        'map',
        'filter',
      ]);
    });

    it('should handle empty array', () => {
      const result = Helpers.zipImportStatementParams([]);
      expect(result).toEqual([]);
    });

    it('should handle single import statement', () => {
      const items: ImportStatementParams[] = [
        { from: '@prisma/client', destruct: ['User'] },
      ];

      const result = Helpers.zipImportStatementParams(items);
      expect(result).toEqual(items);
    });
  });
});
