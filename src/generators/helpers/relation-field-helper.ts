import { DMMF } from '@prisma/generator-helper';
import { isId, isRelation, isUnique } from '../field-classifiers';

export class RelationFieldHelper {
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

    const foreignKeyFields = this.getForeignKeyFields(field, relatedModel);
    const idFields = relatedModel.fields.filter(isId);
    const uniqueFields = relatedModel.fields.filter(isUnique);

    return new Set([...foreignKeyFields, ...idFields, ...uniqueFields]);
  }

  private static getForeignKeyFields(
    field: DMMF.Field,
    relatedModel: DMMF.Model,
  ): DMMF.Field[] {
    const { relationToFields = [] } = field;

    return relationToFields.map((relName) => {
      const rf = relatedModel.fields.find((f) => f.name === relName);
      if (!rf) {
        throw new Error(
          `Can not find foreign key field '${relName}' on model '${relatedModel.name}'`,
        );
      }
      return rf;
    });
  }
}
