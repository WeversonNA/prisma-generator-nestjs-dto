import { TemplateHelpers } from './helpers/template-helpers';
import type { CreateDtoParams } from './types';

interface GenerateCreateDtoParam extends CreateDtoParams {
  exportRelationModifierClasses: boolean;
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator?: boolean;
}
export const generateCreateDto = ({
  model,
  fields,
  imports,
  extraClasses,
  apiExtraModels,
  exportRelationModifierClasses,
  templateHelpers: t,
  addExposePropertyDecorator,
}: GenerateCreateDtoParam): string => `
${TemplateHelpers.importStatements(imports)}

${TemplateHelpers.each(
  extraClasses,
  exportRelationModifierClasses
    ? (content) => `export ${content}`
    : TemplateHelpers.echo,
  '\n',
)}

${TemplateHelpers.when(apiExtraModels.length, t.apiExtraModels(apiExtraModels, true))}
export class ${t.createDtoName(model.name)} {
  ${t.fieldsToDtoProps(fields, true, false, addExposePropertyDecorator)}
}
`;
