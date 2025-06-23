import { TemplateHelpers } from './template-helpers';
import type { EntityParams } from './types';

export interface GenerateEntityParam extends EntityParams {
  templateHelpers: TemplateHelpers;
}
export const generateEntity = ({
  model,
  fields,
  imports,
  apiExtraModels,
  templateHelpers: t,
}: GenerateEntityParam) => `
${TemplateHelpers.importStatements(imports)}

${TemplateHelpers.when(apiExtraModels.length, t.apiExtraModels(apiExtraModels))}
export class ${t.entityName(model.name)} {
  ${t.fieldsToEntityProps(fields)}
}
`;
