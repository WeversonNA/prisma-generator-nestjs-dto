import path from 'node:path';
import {
  isAnnotatedWith,
  isId,
  isRelation,
  isUnique,
} from './field-classifiers';
import type { DMMF } from '@prisma/generator-helper';
import { TemplateHelpers } from './template-helpers';
import type { ImportStatementParams, Model, ParsedField } from './types';

export interface RelationInputResult {
  type: string;
  imports: ImportStatementParams[];
  generatedClasses: string[];
  apiExtraModels: string[];
}

interface GenerateRelationInputParam {
  field: DMMF.Field;
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  preAndSuffixClassName:
    | TemplateHelpers['createDtoName']
    | TemplateHelpers['updateDtoName'];
  canCreateAnnotation: RegExp;
  canConnectAnnotation: RegExp;
  addExposePropertyDecorator: boolean;
}

export class Helpers {
  static uniq<T>(input: T[]): T[] {
    return Array.from(new Set(input));
  }

  static concatIntoArray<T>(source: T[], target: T[]): void {
    source.forEach((item) => target.push(item));
  }

  static makeImportsFromPrismaClient(
    fields: ParsedField[],
  ): ImportStatementParams | null {
    const enumsToImport = Helpers.uniq(
      fields.filter(({ kind }) => kind === 'enum').map(({ type }) => type),
    );
    const importPrisma = fields
      .filter(({ kind }) => kind === 'scalar')
      .some(({ type }) => TemplateHelpers.scalarToTS(type).includes('Prisma'));

    if (!enumsToImport.length && !importPrisma) return null;

    return {
      from: '@prisma/client',
      destruct: importPrisma ? ['Prisma', ...enumsToImport] : enumsToImport,
    };
  }

  static mapDMMFToParsedField(
    field: DMMF.Field,
    overrides: Partial<DMMF.Field> = {},
  ): ParsedField {
    return { ...field, ...overrides };
  }

  static getRelationScalars(fields: DMMF.Field[]): Record<string, string[]> {
    const scalars = fields.flatMap(
      ({ relationFromFields = [] }) => relationFromFields,
    );

    return scalars.reduce(
      (result, scalar) => {
        const related = fields
          .filter(({ relationFromFields = [] }) =>
            relationFromFields.includes(scalar),
          )
          .map(({ name }) => name);
        return { ...result, [scalar]: related };
      },
      {} as Record<string, string[]>,
    );
  }

  static getRelationConnectInputFields({
    field,
    allModels,
  }: {
    field: DMMF.Field;
    allModels: DMMF.Model[];
  }): Set<DMMF.Field> {
    if (!isRelation(field)) {
      throw new Error(
        `Can not resolve RelationConnectInputFields for field '${field.name}'. Not a relation field.`,
      );
    }
    const relatedModel = allModels.find((m) => m.name === field.type);
    if (!relatedModel) {
      throw new Error(
        `Can not resolve RelationConnectInputFields for field '${field.name}'. Related model '${field.type}' unknown.`,
      );
    }
    const { relationToFields = [] } = field;
    if (!relationToFields.length) {
      throw new Error(
        `Can not resolve RelationConnectInputFields for field '${field.name}'. Foreign keys are unknown.`,
      );
    }

    const foreignKeyFields = relationToFields.map((relName) => {
      const rf = relatedModel.fields.find((f) => f.name === relName);
      if (!rf)
        throw new Error(
          `Can not find foreign key field '${relName}' on model '${relatedModel.name}'`,
        );
      return rf;
    });

    const idFields = relatedModel.fields.filter(isId);
    const uniqueFields = relatedModel.fields.filter(isUnique);

    return new Set([...foreignKeyFields, ...idFields, ...uniqueFields]);
  }

  static getRelativePath(from: string, to: string): string {
    const relative = path.relative(from, to);

    const result = relative.split(path.sep).join('/');
    return result || '.';
  }

  static generateRelationInput(
    params: GenerateRelationInputParam,
  ): RelationInputResult {
    const {
      field,
      model,
      allModels,
      templateHelpers: t,
      preAndSuffixClassName,
      canCreateAnnotation,
      canConnectAnnotation,
      addExposePropertyDecorator,
    } = params;

    const relationInputClassProps: Array<
      Pick<ParsedField, 'name' | 'type' | 'documentation'>
    > = [];
    const imports: ImportStatementParams[] = [];
    const apiExtraModels: string[] = [];
    const generatedClasses: string[] = [];

    if (isAnnotatedWith(field, canCreateAnnotation)) {
      const cls = t.createDtoName(field.type);
      apiExtraModels.push(cls);
      const mdl = allModels.find((m) => m.name === field.type);
      if (!mdl)
        throw new Error(
          `related model '${field.type}' for '${model.name}.${field.name}' not found`,
        );

      const rel = Helpers.getRelativePath(model.output.dto, mdl.output.dto);
      imports.push({
        from: `${rel}/${t.createDtoFilename(field.type)}`,
        destruct: [cls],
      });
      relationInputClassProps.push({
        name: 'create',
        type: cls,
        documentation: field.documentation,
      });
    }

    if (isAnnotatedWith(field, canConnectAnnotation)) {
      const cls = t.connectDtoName(field.type);
      apiExtraModels.push(cls);
      const mdl = allModels.find((m) => m.name === field.type);
      if (!mdl)
        throw new Error(
          `related model '${field.type}' for '${model.name}.${field.name}' not found`,
        );
      const rel = Helpers.getRelativePath(model.output.dto, mdl.output.dto);
      imports.push({
        from: `${rel}/${t.connectDtoFilename(field.type)}`,
        destruct: [cls],
      });
      relationInputClassProps.push({
        name: 'connect',
        type: cls,
        documentation: field.documentation,
      });
    }

    if (!relationInputClassProps.length) {
      throw new Error(
        `Can not find relation input props for '${model.name}.${field.name}'`,
      );
    }

    const baseName = `${t.transformClassNameCase(
      model.name,
    )}${t.transformClassNameCase(field.name)}RelationInput`;
    const inputClassName = preAndSuffixClassName(baseName);

    generatedClasses.push(
      `class ${inputClassName} {\n  ${t.fieldsToDtoProps(
        relationInputClassProps.map((f) => ({
          ...f,
          kind: 'relation-input',
          isRequired: relationInputClassProps.length === 1,
          isList: field.isList,
        })),
        true,
        addExposePropertyDecorator,
      )}\n}`,
    );
    apiExtraModels.push(inputClassName);

    return { type: inputClassName, imports, generatedClasses, apiExtraModels };
  }

  static mergeImportStatements(
    first: ImportStatementParams,
    second: ImportStatementParams,
  ): ImportStatementParams {
    if (first.from !== second.from) {
      throw new Error(`Cannot merge import statements; 'from' differs`);
    }
    if (first.default && second.default) {
      throw new Error(`Cannot merge import statements; both have default`);
    }

    const firstDestruct = first.destruct || [];
    const secondDestruct = second.destruct || [];
    const destructStrings = Helpers.uniq(
      [...firstDestruct, ...secondDestruct].filter(
        (x) => typeof x === 'string',
      ),
    );

    const destructObject = [...firstDestruct, ...secondDestruct].reduce(
      (result: Record<string, string>, destructItem) => {
        if (typeof destructItem === 'string') return result;

        return { ...result, ...destructItem };
      },
      {} as Record<string, string>,
    );

    return {
      ...first,
      ...second,
      destruct: [...destructStrings, destructObject],
    };
  }

  static zipImportStatementParams(
    items: ImportStatementParams[],
  ): ImportStatementParams[] {
    const map = items.reduce(
      (acc, item) => {
        const existing = acc[item.from];
        acc[item.from] = existing
          ? Helpers.mergeImportStatements(existing, item)
          : item;
        return acc;
      },
      {} as Record<string, ImportStatementParams>,
    );
    return Object.values(map);
  }
}
