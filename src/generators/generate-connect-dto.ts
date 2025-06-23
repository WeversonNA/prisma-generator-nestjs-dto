import { TemplateHelpers } from './template-helpers';
import type { ConnectDtoParams } from './types';

interface GenerateConnectDtoParam extends ConnectDtoParams {
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator?: boolean;
}
export const generateConnectDto = ({
  model,
  fields,
  imports = [],
  templateHelpers: t,
  addExposePropertyDecorator,
}: GenerateConnectDtoParam) => {
  const template = `
${TemplateHelpers.importStatements(imports)}

export class ${t.connectDtoName(model.name)} {
  ${t.fieldsToDtoProps(fields, true, false, addExposePropertyDecorator)}
}
`;

  return template;
};
