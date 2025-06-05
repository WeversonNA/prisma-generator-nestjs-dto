import fs from 'node:fs/promises';
import path from 'node:path';
import { generatorHandler } from '@prisma/generator-helper';
import { parseEnvValue } from '@prisma/internals';
import { run } from './generator';
import type { GeneratorOptions } from '@prisma/generator-helper';
import type { WriteableFileSpecs, NamingStyle } from './generator/types';
import { MergeContent } from './merge-content';
import { format } from 'prettier';

export const stringToBoolean = (input: string, defaultValue = false) => {
  if (input === 'true') {
    return true;
  }
  if (input === 'false') {
    return false;
  }

  return defaultValue;
};

export const generate = (options: GeneratorOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const output = parseEnvValue(options.generator.output!);

  const {
    connectDtoPrefix = 'Connect',
    createDtoPrefix = 'Create',
    updateDtoPrefix = 'Update',
    dtoSuffix = 'Dto',
    entityPrefix = '',
    entitySuffix = '',
    fileNamingStyle = 'camel',
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

  const mergeContent = new MergeContent();

  return Promise.all(
    results
      .concat(Object.values(indexCollections))
      .map(async ({ fileName, content }) => {
        await fs.mkdir(path.dirname(fileName), { recursive: true });

        const fileExists = await fs
          .access(fileName)
          .then(() => true)
          .catch(() => false);
        const writeContent = fileExists
          ? mergeContent.merge(await fs.readFile(fileName, 'utf8'), content)
          : content;

        const formattedFile = await format(writeContent, {
          parser: 'typescript',
          singleQuote: true,
        });
        return fs.writeFile(fileName, formattedFile);
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
