import {
  DTO_RELATION_MODIFIERS,
  DTO_RELATION_MODIFIERS_ON_CREATE,
  DTO_RELATION_MODIFIERS_ON_UPDATE,
} from '../annotations';
import type { DecoratorImportMapping } from './decorator-config-processor';
import { DecoratorConfigProcessor } from './decorator-config-processor';

interface ValidDecoratorResult {
  importPath: string;
  decoratorName: string;
}

export class DecoratorStrategy {
  private readonly omitDecorators = [
    ...DTO_RELATION_MODIFIERS,
    ...DTO_RELATION_MODIFIERS_ON_CREATE,
    ...DTO_RELATION_MODIFIERS_ON_UPDATE,
  ];
  private decoratorCategories = [
    {
      importPath: '@nestjs/swagger',
      names: [/^@ApiProperty(\(|$)/, /^@ApiExtraModels(\(|$)/],
    },
    {
      importPath: 'class-transformer',
      names: [
        /^@Exclude(\(|$)/,
        /^@Expose(\(|$)/,
        /^@Transform(\(|$)/,
        /^@Type(\(|$)/,
      ],
    },
    {
      importPath: 'class-validator',
      names: [
        /^@Allow(\(|$)/,
        /^@IsDefined(\(|$)/,
        /^@IsOptional(\(|$)/,
        /^@Validate(\(|$)/,
        /^@ValidateBy(\(|$)/,
        /^@ValidateIf(\(|$)/,
        /^@ValidateNested(\(|$)/,
        /^@ValidatePromise(\(|$)/,
        /^@IsLatLong(\(|$)/,
        /^@IsLatitude(\(|$)/,
        /^@IsLongitude(\(|$)/,
        /^@Equals(\(|$)/,
        /^@NotEquals(\(|$)/,
        /^@IsEmpty(\(|$)/,
        /^@IsNotEmpty(\(|$)/,
        /^@IsIn(\(|$)/,
        /^@IsNotIn(\(|$)/,
        /^@IsDivisibleBy(\(|$)/,
        /^@IsPositive(\(|$)/,
        /^@IsNegative(\(|$)/,
        /^@Max(\(|$)/,
        /^@Min(\(|$)/,
        /^@MinDate(\(|$)/,
        /^@MaxDate(\(|$)/,
        /^@Contains(\(|$)/,
        /^@NotContains(\(|$)/,
        /^@IsAlpha(\(|$)/,
        /^@IsAlphanumeric(\(|$)/,
        /^@IsDecimal(\(|$)/,
        /^@IsAscii(\(|$)/,
        /^@IsBase64(\(|$)/,
        /^@IsByteLength(\(|$)/,
        /^@IsCreditCard(\(|$)/,
        /^@IsCurrency(\(|$)/,
        /^@IsEmail(\(|$)/,
        /^@IsFQDN(\(|$)/,
        /^@IsFullWidth(\(|$)/,
        /^@IsHalfWidth(\(|$)/,
        /^@IsVariableWidth(\(|$)/,
        /^@IsHexColor(\(|$)/,
        /^@IsHexadecimal(\(|$)/,
        /^@IsMacAddress(\(|$)/,
        /^@IsIP(\(|$)/,
        /^@IsPort(\(|$)/,
        /^@IsISBN(\(|$)/,
        /^@IsISIN(\(|$)/,
        /^@IsISO8601(\(|$)/,
        /^@IsJSON(\(|$)/,
        /^@IsJWT(\(|$)/,
        /^@IsLowercase(\(|$)/,
        /^@IsMobilePhone(\(|$)/,
        /^@IsISO31661Alpha2(\(|$)/,
        /^@IsISO31661Alpha3(\(|$)/,
        /^@IsMongoId(\(|$)/,
        /^@IsMultibyte(\(|$)/,
        /^@IsSurrogatePair(\(|$)/,
        /^@IsUrl(\(|$)/,
        /^@IsUUID(\(|$)/,
        /^@IsFirebasePushId(\(|$)/,
        /^@IsUppercase(\(|$)/,
        /^@Length(\(|$)/,
        /^@MaxLength(\(|$)/,
        /^@MinLength(\(|$)/,
        /^@Matches(\(|$)/,
        /^@IsPhoneNumber(\(|$)/,
        /^@IsMilitaryTime(\(|$)/,
        /^@IsHash(\(|$)/,
        /^@IsISSN(\(|$)/,
        /^@IsDateString(\(|$)/,
        /^@IsBooleanString(\(|$)/,
        /^@IsNumberString(\(|$)/,
        /^@IsBase32(\(|$)/,
        /^@IsBIC(\(|$)/,
        /^@IsBtcAddress(\(|$)/,
        /^@IsDataURI(\(|$)/,
        /^@IsEAN(\(|$)/,
        /^@IsEthereumAddress(\(|$)/,
        /^@IsHSL(\(|$)/,
        /^@IsIBAN(\(|$)/,
        /^@IsIdentityCard(\(|$)/,
        /^@IsISRC(\(|$)/,
        /^@IsLocale(\(|$)/,
        /^@IsMagnetURI(\(|$)/,
        /^@IsMimeType(\(|$)/,
        /^@IsOctal(\(|$)/,
        /^@IsPassportNumber(\(|$)/,
        /^@IsPostalCode(\(|$)/,
        /^@IsRFC3339(\(|$)/,
        /^@IsRgbColor(\(|$)/,
        /^@IsSemVer(\(|$)/,
        /^@IsStrongPassword(\(|$)/,
        /^@IsTimeZone(\(|$)/,
        /^@IsBase58(\(|$)/,
        /^@is-tax-id(\(|$)/,
        /^@is-iso4217-currency-code(\(|$)/,
        /^@IsBoolean(\(|$)/,
        /^@IsDate(\(|$)/,
        /^@IsNumber(\(|$)/,
        /^@IsEnum(\(|$)/,
        /^@IsInt(\(|$)/,
        /^@IsString(\(|$)/,
        /^@IsArray(\(|$)/,
        /^@IsObject(\(|$)/,
        /^@ArrayContains(\(|$)/,
        /^@ArrayNotContains(\(|$)/,
        /^@ArrayNotEmpty(\(|$)/,
        /^@ArrayMinSize(\(|$)/,
        /^@ArrayMaxSize(\(|$)/,
        /^@ArrayUnique(\(|$)/,
        /^@IsNotEmptyObject(\(|$)/,
        /^@IsInstance(\(|$)/,
      ],
    },
  ];

  private readonly decoratorImportMap: readonly DecoratorImportMapping[];

  constructor(customDecoratorConfigsPath?: string) {
    const decoratorProcessor = new DecoratorConfigProcessor(
      this.decoratorCategories,
      customDecoratorConfigsPath,
    );

    this.decoratorImportMap = decoratorProcessor.mappings;
  }

  getValidDecorators(doc: string): string[] {
    const decorators = this.decoratorsStringToArray(doc);
    return decorators.filter(
      (decorator) =>
        this.verifyIfDecoratorIsValid(decorator) &&
        !this.omitDecorators.find((omitDecorator) =>
          omitDecorator.test(decorator),
        ),
    );
  }

  private decoratorsStringToArray(doc: string): string[] {
    const decorators = doc
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('@'));
    return decorators;
  }

  verifyIfDecoratorIsValid(decoratorName: string): boolean {
    return this.decoratorImportMap.some(({ name }) => name.test(decoratorName));
  }

  getValidDecoratorAndImportsByDoc(doc?: string): ValidDecoratorResult[] {
    if (!doc) return [];
    const decorators = this.decoratorsStringToArray(doc);

    return decorators
      .map((decorator) => this.getValidDecoratorAndImports(decorator))
      .filter((result): result is ValidDecoratorResult => !!result);
  }

  formatValidDecoratorResultToFromDestruct(
    validDecoratorResult: ValidDecoratorResult[],
  ): { from: string; destruct: string[] }[] {
    return Array.from(
      validDecoratorResult.reduce(
        (map, { importPath, decoratorName }) =>
          map.set(importPath, [...(map.get(importPath) ?? []), decoratorName]),
        new Map<string, string[]>(),
      ),
    ).map(([from, destruct]) => ({ from, destruct }));
  }

  getValidDecoratorAndImports(
    decoratorName: string,
  ): ValidDecoratorResult | undefined {
    const match = this.decoratorImportMap.find(({ name }) =>
      name.test(decoratorName),
    );
    if (!match) return undefined;

    const decoratorBaseName = match.name.source
      .replace(/^\^@/, '')
      .replace(/\(.*/, '');

    return { importPath: match.importPath, decoratorName: decoratorBaseName };
  }
}
