import type { TemplateHelpers } from './template-helpers';
import type { ConnectDtoParams } from './types';

interface GenerateConnectDtoParam extends ConnectDtoParams {
  templateHelpers: TemplateHelpers;
  addExposePropertyDecorator?: boolean;
}
export const generateConnectDto = ({
  model,
  fields,
  templateHelpers: t,
  addExposePropertyDecorator,
}: GenerateConnectDtoParam) => {
  const template = `
  export class ${t.connectDtoName(model.name)} {
    ${t.fieldsToDtoProps(fields, true, false, addExposePropertyDecorator)}
  }
  `;

  return template;
};
