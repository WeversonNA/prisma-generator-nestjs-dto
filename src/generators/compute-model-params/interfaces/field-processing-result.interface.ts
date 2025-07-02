import type { ParsedField, ImportStatementParams } from '../../types';

export interface FieldProcessingResult {
  fields: ParsedField[];
  imports: ImportStatementParams[];
  extraClasses: string[];
  apiExtraModels: string[];
  hasEnum: boolean;
}
