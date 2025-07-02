import { PrismaTypeConverter } from './type-converter';
import type { ParsedField } from '../types';

describe('PrismaTypeConverter', () => {
  let converter: PrismaTypeConverter;

  beforeEach(() => {
    converter = new PrismaTypeConverter();
  });

  describe('scalarToTS', () => {
    it('should convert String to string', () => {
      const result = converter.scalarToTS('String');
      expect(result).toBe('string');
    });

    it('should convert Boolean to boolean', () => {
      const result = converter.scalarToTS('Boolean');
      expect(result).toBe('boolean');
    });

    it('should convert Int to number', () => {
      const result = converter.scalarToTS('Int');
      expect(result).toBe('number');
    });

    it('should convert BigInt to bigint', () => {
      const result = converter.scalarToTS('BigInt');
      expect(result).toBe('bigint');
    });

    it('should convert Float to number', () => {
      const result = converter.scalarToTS('Float');
      expect(result).toBe('number');
    });

    it('should convert Decimal to Prisma.Decimal', () => {
      const result = converter.scalarToTS('Decimal');
      expect(result).toBe('Prisma.Decimal');
    });

    it('should convert DateTime to Date', () => {
      const result = converter.scalarToTS('DateTime');
      expect(result).toBe('Date');
    });

    it('should convert Json to Prisma.JsonValue', () => {
      const result = converter.scalarToTS('Json');
      expect(result).toBe('Prisma.JsonValue');
    });

    it('should convert Json to Prisma.InputJsonValue when useInputTypes is true', () => {
      const result = converter.scalarToTS('Json', true);
      expect(result).toBe('Prisma.InputJsonValue');
    });

    it('should convert Bytes to Buffer', () => {
      const result = converter.scalarToTS('Bytes');
      expect(result).toBe('Buffer');
    });

    it('should throw error for unrecognized scalar type', () => {
      expect(() => {
        converter.scalarToTS('UnknownType');
      }).toThrow('Unrecognized scalar type: UnknownType');
    });

    it('should handle useInputTypes for other types (should return same value)', () => {
      const result = converter.scalarToTS('String', true);
      expect(result).toBe('string');
    });
  });

  describe('fieldType', () => {
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

    describe('scalar fields', () => {
      it('should return TypeScript type for scalar field', () => {
        const field = createMockField({ kind: 'scalar', type: 'String' });
        const result = converter.fieldType(field);
        expect(result).toBe('string');
      });

      it('should handle input types for scalar fields', () => {
        const field = createMockField({ kind: 'scalar', type: 'Json' });
        const result = converter.fieldType(field, true);
        expect(result).toBe('Prisma.InputJsonValue');
      });

      it('should handle various scalar types', () => {
        const intField = createMockField({ kind: 'scalar', type: 'Int' });
        expect(converter.fieldType(intField)).toBe('number');

        const boolField = createMockField({ kind: 'scalar', type: 'Boolean' });
        expect(converter.fieldType(boolField)).toBe('boolean');

        const dateField = createMockField({ kind: 'scalar', type: 'DateTime' });
        expect(converter.fieldType(dateField)).toBe('Date');
      });
    });

    describe('enum fields', () => {
      it('should return enum type for single enum field', () => {
        const field = createMockField({
          kind: 'enum',
          type: 'UserRole',
          isList: false,
        });
        const result = converter.fieldType(field);
        expect(result).toBe('UserRole');
      });

      it('should return array enum type for list enum field', () => {
        const field = createMockField({
          kind: 'enum',
          type: 'UserRole',
          isList: true,
        });
        const result = converter.fieldType(field);
        expect(result).toBe('UserRole[]');
      });
    });

    describe('relation-input fields', () => {
      it('should return type with entity prefix and suffix for relation-input', () => {
        const field = createMockField({
          kind: 'relation-input',
          type: 'UserCreateInput',
        });
        const result = converter.fieldType(field, false, 'Entity', 'Model');
        expect(result).toBe('EntityUserCreateInputModel');
      });

      it('should handle relation-input without prefix/suffix', () => {
        const field = createMockField({
          kind: 'relation-input',
          type: 'UserCreateInput',
        });
        const result = converter.fieldType(field);
        expect(result).toBe('UserCreateInput');
      });
    });

    describe('object/relation fields', () => {
      it('should return type for single relation field', () => {
        const field = createMockField({
          kind: 'object',
          type: 'User',
          isList: false,
        });
        const result = converter.fieldType(field);
        expect(result).toBe('User');
      });

      it('should return array type for list relation field', () => {
        const field = createMockField({
          kind: 'object',
          type: 'Post',
          isList: true,
        });
        const result = converter.fieldType(field);
        expect(result).toBe('Post[]');
      });

      it('should apply entity prefix and suffix to relation fields', () => {
        const field = createMockField({
          kind: 'object',
          type: 'User',
          isList: false,
        });
        const result = converter.fieldType(field, false, 'Entity', 'Model');
        expect(result).toBe('EntityUserModel');
      });

      it('should apply entity prefix and suffix to relation list fields', () => {
        const field = createMockField({
          kind: 'object',
          type: 'Post',
          isList: true,
        });
        const result = converter.fieldType(field, false, 'Entity', 'Model');
        expect(result).toBe('EntityPostModel[]');
      });
    });

    describe('unsupported fields', () => {
      it('should handle unsupported field kind as object relation', () => {
        const field = createMockField({
          kind: 'unsupported',
          type: 'CustomType',
          isList: false,
        });
        const result = converter.fieldType(field);
        expect(result).toBe('CustomType');
      });

      it('should handle unsupported field kind as array', () => {
        const field = createMockField({
          kind: 'unsupported',
          type: 'CustomType',
          isList: true,
        });
        const result = converter.fieldType(field);
        expect(result).toBe('CustomType[]');
      });
    });

    describe('edge cases', () => {
      it('should handle toInputType parameter for non-scalar fields', () => {
        const field = createMockField({ kind: 'object', type: 'User' });
        const result = converter.fieldType(field, true);
        expect(result).toBe('User');
      });

      it('should handle empty entity prefix and suffix', () => {
        const field = createMockField({ kind: 'object', type: 'User' });
        const result = converter.fieldType(field, false, '', '');
        expect(result).toBe('User');
      });

      it('should handle only entity prefix', () => {
        const field = createMockField({ kind: 'object', type: 'User' });
        const result = converter.fieldType(field, false, 'Entity', '');
        expect(result).toBe('EntityUser');
      });

      it('should handle only entity suffix', () => {
        const field = createMockField({ kind: 'object', type: 'User' });
        const result = converter.fieldType(field, false, '', 'Model');
        expect(result).toBe('UserModel');
      });
    });
  });
});
