import { TemplateHelpers } from './helpers/template-helpers';
import type { EntityParams } from './types';

export interface GenerateEntityParam extends EntityParams {
  templateHelpers: TemplateHelpers;
  entityPrefix?: string;
  entitySuffix?: string;
}
export const generateEntity = ({
  model,
  fields,
  imports,
  apiExtraModels,
  templateHelpers: t,
  entityPrefix,
  entitySuffix,
}: GenerateEntityParam): string => `
${TemplateHelpers.importStatements(imports)}

${TemplateHelpers.when(apiExtraModels.length, t.apiExtraModels(apiExtraModels))}
export class ${t.entityName(model.name)} {
  ${t.fieldsToEntityProps(fields, entityPrefix, entitySuffix)}
}
`;
