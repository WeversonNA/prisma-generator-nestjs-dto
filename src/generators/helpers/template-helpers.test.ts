import {
  TemplateHelpers,
  type TemplateHelpersOptions,
} from './template-helpers';
import type { ParsedField } from '../types';
import { camel } from 'case';

describe('TemplateHelpers', () => {
  const defaultOptions: TemplateHelpersOptions = {
    connectDtoPrefix: 'Connect',
    createDtoPrefix: 'Create',
    updateDtoPrefix: 'Update',
    dtoSuffix: 'Dto',
    entityPrefix: '',
    entitySuffix: '',
  };

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

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const helpers = new TemplateHelpers(defaultOptions);
      expect(helpers).toBeInstanceOf(TemplateHelpers);
    });

    it('should use custom transform functions when provided', () => {
      const options: TemplateHelpersOptions = {
        ...defaultOptions,
        transformClassNameCase: (input: string) => input.toUpperCase(),
        transformFileNameCase: (input: string) => input.toLowerCase(),
      };

      const helpers = new TemplateHelpers(options);
      expect(helpers.transformClassNameCase('test')).toBe('TEST');
      expect(helpers.transformFileNameCase('TEST')).toBe('test');
    });
  });

  describe('naming methods', () => {
    let helpers: TemplateHelpers;

    beforeEach(() => {
      helpers = new TemplateHelpers({
        ...defaultOptions,
        entityPrefix: 'Entity',
        entitySuffix: 'Model',
      });
    });

    describe('entityName', () => {
      it('should apply prefix and suffix by default', () => {
        const result = helpers.entityName('User');
        expect(result).toBe('EntityUserModel');
      });

      it('should ignore prefix and suffix when requested', () => {
        const result = helpers.entityName('User', true);
        expect(result).toBe('User');
      });
    });

    describe('connectDtoName', () => {
      it('should apply connect prefix and dto suffix', () => {
        const result = helpers.connectDtoName('User');
        expect(result).toBe('ConnectUserDto');
      });
    });

    describe('createDtoName', () => {
      it('should apply create prefix and dto suffix', () => {
        const result = helpers.createDtoName('User');
        expect(result).toBe('CreateUserDto');
      });
    });

    describe('updateDtoName', () => {
      it('should apply update prefix and dto suffix', () => {
        const result = helpers.updateDtoName('User');
        expect(result).toBe('UpdateUserDto');
      });
    });
  });

  describe('file naming methods', () => {
    let helpers: TemplateHelpers;

    beforeEach(() => {
      const options: TemplateHelpersOptions = {
        ...defaultOptions,
        transformFileNameCase: (input: string) => camel(input),
      };
      helpers = new TemplateHelpers(options);
    });

    describe('connectDtoFilename', () => {
      it('should generate filename without extension by default', () => {
        const result = helpers.connectDtoFilename('User');
        expect(result).toBe('connect-user.dto');
      });

      it('should include extension when requested', () => {
        const result = helpers.connectDtoFilename('User', true);
        expect(result).toBe('connect-user.dto.ts');
      });
    });

    describe('createDtoFilename', () => {
      it('should generate filename without extension by default', () => {
        const result = helpers.createDtoFilename('User');
        expect(result).toBe('create-user.dto');
      });

      it('should include extension when requested', () => {
        const result = helpers.createDtoFilename('User', true);
        expect(result).toBe('create-user.dto.ts');
      });
    });

    describe('updateDtoFilename', () => {
      it('should generate filename without extension by default', () => {
        const result = helpers.updateDtoFilename('User');
        expect(result).toBe('update-user.dto');
      });

      it('should include extension when requested', () => {
        const result = helpers.updateDtoFilename('User', true);
        expect(result).toBe('update-user.dto.ts');
      });
    });

    describe('entityFilename', () => {
      it('should generate entity filename without extension by default', () => {
        const result = helpers.entityFilename('User');
        expect(result).toBe('user.entity');
      });

      it('should include extension when requested', () => {
        const result = helpers.entityFilename('User', true);
        expect(result).toBe('user.entity.ts');
      });
    });
  });

  describe('static utility methods', () => {
    describe('echo', () => {
      it('should return the same input', () => {
        const input = 'test string';
        const result = TemplateHelpers.echo(input);
        expect(result).toBe(input);
      });
    });

    describe('when', () => {
      it('should return thenTpl when condition is truthy', () => {
        const result = TemplateHelpers.when(true, 'then', 'else');
        expect(result).toBe('then');
      });

      it('should return elseTpl when condition is falsy', () => {
        const result = TemplateHelpers.when(false, 'then', 'else');
        expect(result).toBe('else');
      });

      it('should return empty string when condition is falsy and no elseTpl', () => {
        const result = TemplateHelpers.when(false, 'then');
        expect(result).toBe('');
      });
    });

    describe('unless', () => {
      it('should return thenTpl when condition is falsy', () => {
        const result = TemplateHelpers.unless(false, 'then', 'else');
        expect(result).toBe('then');
      });

      it('should return elseTpl when condition is truthy', () => {
        const result = TemplateHelpers.unless(true, 'then', 'else');
        expect(result).toBe('else');
      });

      it('should return empty string when condition is truthy and no elseTpl', () => {
        const result = TemplateHelpers.unless(true, 'then');
        expect(result).toBe('');
      });
    });

    describe('each', () => {
      it('should map array items and join with default separator', () => {
        const arr = [1, 2, 3];
        const result = TemplateHelpers.each(arr, (item) => `item${item}`);
        expect(result).toBe('item1item2item3');
      });

      it('should use custom separator when provided', () => {
        const arr = [1, 2, 3];
        const result = TemplateHelpers.each(arr, (item) => `item${item}`, ', ');
        expect(result).toBe('item1, item2, item3');
      });

      it('should handle empty array', () => {
        const result = TemplateHelpers.each(
          [],
          (item: number) => `item${item}`,
        );
        expect(result).toBe('');
      });
    });

    describe('scalarToTS', () => {
      it('should convert Prisma scalar types to TypeScript types', () => {
        expect(TemplateHelpers.scalarToTS('String')).toBe('string');
        expect(TemplateHelpers.scalarToTS('Int')).toBe('number');
        expect(TemplateHelpers.scalarToTS('Boolean')).toBe('boolean');
      });

      it('should handle input types when specified', () => {
        const result = TemplateHelpers.scalarToTS('DateTime', true);

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('type and property methods', () => {
    let helpers: TemplateHelpers;

    beforeEach(() => {
      helpers = new TemplateHelpers(defaultOptions);
    });

    describe('fieldType', () => {
      it('should return field type for scalar field', () => {
        const field = createMockField({ kind: 'scalar', type: 'String' });
        const result = helpers.fieldType(field);
        expect(result).toBe('string');
      });

      it('should handle input types when specified', () => {
        const field = createMockField({ kind: 'scalar', type: 'String' });
        const result = helpers.fieldType(field, true);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    describe('fieldsToDtoProps', () => {
      it('should generate DTO properties from fields', () => {
        const fields = [
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
            isRequired: false,
          }),
        ];

        const result = helpers.fieldsToDtoProps(fields);
        expect(result).toContain('id');
        expect(result).toContain('name');
      });

      it('should handle empty fields array', () => {
        const result = helpers.fieldsToDtoProps([]);
        expect(result).toBe('');
      });
    });

    describe('fieldsToEntityProps', () => {
      it('should generate entity properties from fields', () => {
        const fields = [
          createMockField({ name: 'id', type: 'Int', kind: 'scalar' }),
          createMockField({ name: 'name', type: 'String', kind: 'scalar' }),
        ];

        const result = helpers.fieldsToEntityProps(fields);
        expect(result).toContain('id');
        expect(result).toContain('name');
      });
    });
  });

  describe('apiExtraModels', () => {
    let helpers: TemplateHelpers;

    beforeEach(() => {
      helpers = new TemplateHelpers({
        ...defaultOptions,
        entityPrefix: 'Entity',
        entitySuffix: 'Model',
      });
    });

    it('should generate ApiExtraModels decorator with entity names', () => {
      const names = ['User', 'Post'];
      const result = helpers.apiExtraModels(names);
      expect(result).toBe('@ApiExtraModels(EntityUserModel, EntityPostModel)');
    });

    it('should ignore prefix and suffix when requested', () => {
      const names = ['User', 'Post'];
      const result = helpers.apiExtraModels(names, true);
      expect(result).toBe('@ApiExtraModels(User, Post)');
    });

    it('should handle empty names array', () => {
      const result = helpers.apiExtraModels([]);
      expect(result).toBe('@ApiExtraModels()');
    });

    it('should handle single name', () => {
      const result = helpers.apiExtraModels(['User']);
      expect(result).toBe('@ApiExtraModels(EntityUserModel)');
    });
  });

  describe('configuration', () => {
    let helpers: TemplateHelpers;

    beforeEach(() => {
      helpers = new TemplateHelpers({
        ...defaultOptions,
      });
    });

    describe('transformClassNameCase', () => {
      it('should return default transform function when not provided', () => {
        const result = helpers.transformClassNameCase('test');
        expect(result).toBe('test');
      });
    });

    describe('transformFileNameCase', () => {
      it('should return default transform function when not provided', () => {
        const result = helpers.transformFileNameCase('test');
        expect(result).toBe('test');
      });
    });

    describe('config', () => {
      it('should return configuration without transform functions', () => {
        const config = helpers.config;
        expect(config).toEqual({
          connectDtoPrefix: 'Connect',
          createDtoPrefix: 'Create',
          updateDtoPrefix: 'Update',
          dtoSuffix: 'Dto',
          entityPrefix: '',
          entitySuffix: '',
        });
      });
    });
  });
});
