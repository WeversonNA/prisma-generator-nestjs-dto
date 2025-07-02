/**
 * Enhanced merge that preserves user fields while syncing schema fields.
 * Uses a completely new approach that doesn't rely on the original merge.
 */
export class SmartMergeContent {
  private readonly SCHEMA_MARKER = '// @generated from prisma schema';

  merge(existingText: string, generatedText: string): string {
    if (!existingText.trim()) {
      return generatedText;
    }

    try {
      const userFields = this.extractUserFields(existingText);

      if (userFields.length === 0) {
        return generatedText;
      }

      let result = this.insertUserFieldsIntoGenerated(
        generatedText,
        userFields,
      );

      return result;
    } catch (error) {
      console.warn(
        'Smart merge failed, falling back to generated content:',
        error,
      );
      return generatedText;
    }
  }

  private extractUserFields(
    text: string,
  ): Array<{ name: string; code: string }> {
    const userFields: Array<{ name: string; code: string }> = [];
    const lines = text.split('\n');

    let i = 0;
    while (i < lines.length) {
      if (this.shouldSkipLine(lines[i])) {
        i++;
        continue;
      }

      const fieldBlock = this.extractFieldBlock(lines, i);
      if (fieldBlock) {
        if (!this.isSchemaGenerated(fieldBlock.code)) {
          userFields.push({
            name: fieldBlock.name,
            code: fieldBlock.code,
          });
        }
        i = fieldBlock.endIndex;
      } else {
        i++;
      }
    }

    return userFields;
  }

  private shouldSkipLine(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export class ') ||
      trimmed.includes('@ApiExtraModels') ||
      trimmed === '' ||
      trimmed === '}' ||
      trimmed === '{'
    );
  }

  private extractFieldBlock(
    lines: string[],
    startIndex: number,
  ): { name: string; code: string; endIndex: number } | null {
    let i = startIndex;
    let blockLines: string[] = [];
    let fieldName = '';
    let foundProperty = false;

    let lookAhead = i;
    while (lookAhead < lines.length && lookAhead < i + 10) {
      const line = lines[lookAhead];
      if (this.isPropertyDeclaration(line)) {
        foundProperty = true;
        fieldName = this.extractFieldName(line) || '';
        break;
      }
      if (this.isEndOfBlock(line)) {
        break;
      }
      lookAhead++;
    }

    if (!foundProperty || !fieldName) {
      return null;
    }

    while (i <= lookAhead && i < lines.length) {
      const line = lines[i];
      blockLines.push(line);

      if (this.isPropertyDeclaration(line)) {
        i++;
        break;
      }
      i++;
    }

    return {
      name: fieldName,
      code: blockLines.join('\n').trim(),
      endIndex: i,
    };
  }

  private isPropertyDeclaration(line: string): boolean {
    const trimmed = line.trim();
    return /^\s*\w+[?!]?\s*:\s*/.test(trimmed) && trimmed.includes(';');
  }

  private isEndOfBlock(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed === '}' ||
      trimmed.startsWith('export ') ||
      trimmed.startsWith('import ')
    );
  }

  private extractFieldName(line: string): string | null {
    const match = line.match(/(\w+)[?!]?\s*:/);
    return match ? match[1] : null;
  }

  private isSchemaGenerated(fieldCode: string): boolean {
    return fieldCode.includes(this.SCHEMA_MARKER);
  }

  private insertUserFieldsIntoGenerated(
    generatedText: string,
    userFields: Array<{ name: string; code: string }>,
  ): string {
    const lines = generatedText.split('\n');

    let insertIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '}') {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      return generatedText;
    }

    const insertLines: string[] = [];

    for (const field of userFields) {
      insertLines.push('');

      const fieldLines = field.code.split('\n');
      for (const fieldLine of fieldLines) {
        if (fieldLine.trim()) {
          insertLines.push('  ' + fieldLine.replace(/^\s+/, ''));
        } else {
          insertLines.push(fieldLine);
        }
      }
    }

    lines.splice(insertIndex, 0, ...insertLines);

    return lines.join('\n');
  }
}
