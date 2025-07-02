import type { GeneratorOptions } from '@prisma/generator-helper';
import { generatorHandler } from '@prisma/generator-helper';
import { parseEnvValue } from '@prisma/internals';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'node:path';
import { format } from 'prettier';
import { SmartMergeContentV2 } from './commands/smart-merge-content-v2';
import { run } from './generators';
import type { NamingStyle, WriteableFileSpecs } from './generators/types';

export const stringToBoolean = (
  input: string,
  defaultValue = false,
): boolean => {
  if (input === 'true') {
    return true;
  }
  if (input === 'false') {
    return false;
  }

  return defaultValue;
};

export const generate = (options: GeneratorOptions): Promise<void[]> => {
  const output = parseEnvValue(options.generator.output!);

  const {
    connectDtoPrefix = 'Connect',
    createDtoPrefix = 'Create',
    updateDtoPrefix = 'Update',
    dtoSuffix = 'Dto',
    entityPrefix = '',
    entitySuffix = '',
    fileNamingStyle = 'camel',
    decoratorConfigPath,
  } = options.generator.config;

  const exportRelationModifierClasses = stringToBoolean(
    options.generator.config.exportRelationModifierClasses,
    true,
  );

  const outputToNestJsResourceStructure = stringToBoolean(
    options.generator.config.outputToNestJsResourceStructure,
    // using `true` as default value would be a breaking change
    false,
  );

  const reExport = stringToBoolean(
    options.generator.config.reExport,
    // using `true` as default value would be a breaking change
    false,
  );

  const addExposePropertyDecorator = stringToBoolean(
    options.generator.config.addExposePropertyDecorator,
    false,
  );

  const supportedFileNamingStyles = ['kebab', 'camel', 'pascal', 'snake'];
  const isSupportedFileNamingStyle = (style: string): style is NamingStyle =>
    supportedFileNamingStyles.includes(style);

  if (!isSupportedFileNamingStyle(fileNamingStyle)) {
    throw new Error(
      `'${fileNamingStyle}' is not a valid file naming style. Valid options are ${supportedFileNamingStyles
        .map((s) => `'${s}'`)
        .join(', ')}.`,
    );
  }

  const results = run({
    output,
    dmmf: options.dmmf,
    exportRelationModifierClasses,
    outputToNestJsResourceStructure,
    connectDtoPrefix,
    createDtoPrefix,
    updateDtoPrefix,
    dtoSuffix,
    entityPrefix,
    entitySuffix,
    fileNamingStyle,
    addExposePropertyDecorator,
    decoratorConfigPath,
  });

  const indexCollections: Record<string, WriteableFileSpecs> = {};

  if (reExport) {
    results.forEach(({ fileName }) => {
      const dirName = path.dirname(fileName);

      const { [dirName]: fileSpec } = indexCollections;
      indexCollections[dirName] = {
        fileName: fileSpec?.fileName || path.join(dirName, 'index.ts'),
        content: [
          fileSpec?.content || '',
          `export * from './${path.basename(fileName, '.ts')}';`,
        ].join('\n'),
      };
    });
  }

  const mergeContent = new SmartMergeContentV2();

  return Promise.all(
    results
      .concat(Object.values(indexCollections))
      .map(async ({ fileName, content }) => {
        await mkdir(path.dirname(fileName), { recursive: true });

        const fileExists = await access(fileName)
          .then(() => true)
          .catch(() => false);

        const writeContent = fileExists
          ? mergeContent.merge(await readFile(fileName, 'utf8'), content)
          : content;

        const formattedFile = await format(writeContent, {
          parser: 'typescript',
          singleQuote: true,
        });
        return writeFile(fileName, formattedFile);
      }),
  );
};

generatorHandler({
  onManifest: () => ({
    defaultOutput: '../src/generated/nestjs-dto',
    prettyName: 'NestJS DTO Generator',
  }),
  onGenerate: generate,
});
