import { TemplateHelpers } from './template-helpers';
import type { UpdateDtoParams } from './types';

export interface GenerateUpdateDtoParam extends UpdateDtoParams {
  exportRelationModifierClasses: boolean;
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator: boolean;
}
export const generateUpdateDto = ({
  model,
  fields,
  imports,
  extraClasses,
  apiExtraModels,
  exportRelationModifierClasses,
  templateHelpers: t,
  addExposePropertyDecorator,
}: GenerateUpdateDtoParam) => `
${TemplateHelpers.importStatements(imports)}

${TemplateHelpers.each(
  extraClasses,
  exportRelationModifierClasses
    ? (content) => `export ${content}`
    : TemplateHelpers.echo,
  '\n',
)}

${TemplateHelpers.when(apiExtraModels.length, t.apiExtraModels(apiExtraModels, true))}
export class ${t.updateDtoName(model.name)} {
  ${t.fieldsToDtoProps(fields, true, false, addExposePropertyDecorator)}
}
`;
