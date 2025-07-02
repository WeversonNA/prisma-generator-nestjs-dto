import type { DMMF } from '@prisma/generator-helper';
import {
  isAnnotatedWith,
  isAnnotatedWithOneOf,
  isId,
  isRequired,
  isScalar,
  hasDefaultValue,
  isUnique,
  isRelation,
  isIdWithDefaultValue,
  isReadOnly,
  isUpdatedAt,
  isRequiredWithDefaultValue,
} from './field-classifiers';
import { DTO_READ_ONLY } from './annotations';

describe('field-classifiers', () => {
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
    dbName: null,
    fields: [],
    uniqueFields: [],
    uniqueIndexes: [],
    documentation: '',
    idFields: [],
    isEmbedded: false,
    ...overrides,
  });

  describe('isAnnotatedWith', () => {
    it('should return true when field has matching annotation', () => {
      const field = createMockField({
        documentation: '@DtoReadOnly Some description',
      });

      const result = isAnnotatedWith(field, DTO_READ_ONLY);
      expect(result).toBe(true);
    });

    it('should return false when field does not have matching annotation', () => {
      const field = createMockField({
        documentation: 'Some other documentation',
      });

      const result = isAnnotatedWith(field, DTO_READ_ONLY);
      expect(result).toBe(false);
    });

    it('should return false when field has no documentation', () => {
      const field = createMockField();

      const result = isAnnotatedWith(field, DTO_READ_ONLY);
      expect(result).toBe(false);
    });

    it('should work with models', () => {
      const model = createMockModel({
        documentation: '@DtoReadOnly Model description',
      });

      const result = isAnnotatedWith(model, DTO_READ_ONLY);
      expect(result).toBe(true);
    });
  });

  describe('isAnnotatedWithOneOf', () => {
    const annotation1 = /annotation1/;
    const annotation2 = /annotation2/;
    const annotations = [annotation1, annotation2];

    it('should return true when field has one of the annotations', () => {
      const field = createMockField({
        documentation: 'annotation1 test',
      });

      const result = isAnnotatedWithOneOf(field, annotations);
      expect(result).toBe(true);
    });

    it('should return true when field has multiple annotations', () => {
      const field = createMockField({
        documentation: 'annotation1 annotation2 test',
      });

      const result = isAnnotatedWithOneOf(field, annotations);
      expect(result).toBe(true);
    });

    it('should return false when field has none of the annotations', () => {
      const field = createMockField({
        documentation: 'some other text',
      });

      const result = isAnnotatedWithOneOf(field, annotations);
      expect(result).toBe(false);
    });
  });

  describe('isId', () => {
    it('should return true when field is an ID', () => {
      const field = createMockField({ isId: true });

      const result = isId(field);
      expect(result).toBe(true);
    });

    it('should return false when field is not an ID', () => {
      const field = createMockField({ isId: false });

      const result = isId(field);
      expect(result).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('should return true when field is required', () => {
      const field = createMockField({ isRequired: true });

      const result = isRequired(field);
      expect(result).toBe(true);
    });

    it('should return false when field is not required', () => {
      const field = createMockField({ isRequired: false });

      const result = isRequired(field);
      expect(result).toBe(false);
    });
  });

  describe('isScalar', () => {
    it('should return true when field is scalar', () => {
      const field = createMockField({ kind: 'scalar' });

      const result = isScalar(field);
      expect(result).toBe(true);
    });

    it('should return false when field is not scalar', () => {
      const field = createMockField({ kind: 'object' });

      const result = isScalar(field);
      expect(result).toBe(false);
    });
  });

  describe('hasDefaultValue', () => {
    it('should return true when field has default value', () => {
      const field = createMockField({ hasDefaultValue: true });

      const result = hasDefaultValue(field);
      expect(result).toBe(true);
    });

    it('should return false when field has no default value', () => {
      const field = createMockField({ hasDefaultValue: false });

      const result = hasDefaultValue(field);
      expect(result).toBe(false);
    });
  });

  describe('isUnique', () => {
    it('should return true when field is unique', () => {
      const field = createMockField({ isUnique: true });

      const result = isUnique(field);
      expect(result).toBe(true);
    });

    it('should return false when field is not unique', () => {
      const field = createMockField({ isUnique: false });

      const result = isUnique(field);
      expect(result).toBe(false);
    });
  });

  describe('isRelation', () => {
    it('should return true when field is a relation (object)', () => {
      const field = createMockField({ kind: 'object' });

      const result = isRelation(field);
      expect(result).toBe(true);
    });

    it('should return false when field is not a relation', () => {
      const field = createMockField({ kind: 'scalar' });

      const result = isRelation(field);
      expect(result).toBe(false);
    });

    it('should return false when field is enum', () => {
      const field = createMockField({ kind: 'enum' });

      const result = isRelation(field);
      expect(result).toBe(false);
    });
  });

  describe('isIdWithDefaultValue', () => {
    it('should return true when field is ID with default value', () => {
      const field = createMockField({
        isId: true,
        hasDefaultValue: true,
      });

      const result = isIdWithDefaultValue(field);
      expect(result).toBe(true);
    });

    it('should return false when field is ID without default value', () => {
      const field = createMockField({
        isId: true,
        hasDefaultValue: false,
      });

      const result = isIdWithDefaultValue(field);
      expect(result).toBe(false);
    });

    it('should return false when field is not ID but has default value', () => {
      const field = createMockField({
        isId: false,
        hasDefaultValue: true,
      });

      const result = isIdWithDefaultValue(field);
      expect(result).toBe(false);
    });
  });

  describe('isReadOnly', () => {
    it('should return true when field has isReadOnly property', () => {
      const field = createMockField({ isReadOnly: true });

      const result = isReadOnly(field);
      expect(result).toBe(true);
    });

    it('should return true when field is annotated with @DtoReadOnly', () => {
      const field = createMockField({
        isReadOnly: false,
        documentation: '@DtoReadOnly test field',
      });

      const result = isReadOnly(field);
      expect(result).toBe(true);
    });

    it('should return false when field is neither readonly nor annotated', () => {
      const field = createMockField({
        isReadOnly: false,
        documentation: 'normal field',
      });

      const result = isReadOnly(field);
      expect(result).toBe(false);
    });
  });

  describe('isUpdatedAt', () => {
    it('should return true when field is updatedAt', () => {
      const field = createMockField({ isUpdatedAt: true });

      const result = isUpdatedAt(field);
      expect(result).toBe(true);
    });

    it('should return false when field is not updatedAt', () => {
      const field = createMockField({ isUpdatedAt: false });

      const result = isUpdatedAt(field);
      expect(result).toBe(false);
    });
  });

  describe('isRequiredWithDefaultValue', () => {
    it('should return true when field is required and has default value', () => {
      const field = createMockField({
        isRequired: true,
        hasDefaultValue: true,
      });

      const result = isRequiredWithDefaultValue(field);
      expect(result).toBe(true);
    });

    it('should return false when field is required but has no default value', () => {
      const field = createMockField({
        isRequired: true,
        hasDefaultValue: false,
      });

      const result = isRequiredWithDefaultValue(field);
      expect(result).toBe(false);
    });

    it('should return false when field is not required but has default value', () => {
      const field = createMockField({
        isRequired: false,
        hasDefaultValue: true,
      });

      const result = isRequiredWithDefaultValue(field);
      expect(result).toBe(false);
    });

    it('should return false when field is neither required nor has default value', () => {
      const field = createMockField({
        isRequired: false,
        hasDefaultValue: false,
      });

      const result = isRequiredWithDefaultValue(field);
      expect(result).toBe(false);
    });
  });
});
