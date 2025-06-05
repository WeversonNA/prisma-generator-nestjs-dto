interface ValidDecoratorResult {
  importPath: string;
  decoratorName: string;
}

export class DecoratorStrategy {
  private readonly decoratorCategories = [
    {
      importPath: '@nestjs/swagger',
      names: ['ApiProperty', 'ApiExtraModels'],
    },
    {
      importPath: 'class-transformer',
      names: ['Exclude', 'Expose', 'Transform', 'Type'],
    },
    {
      importPath: 'class-validator',
      names: [
        'Allow',
        'IsDefined',
        'IsOptional',
        'Validate',
        'ValidateBy',
        'ValidateIf',
        'ValidateNested',
        'ValidatePromise',
        'IsLatLong',
        'IsLatitude',
        'IsLongitude',
        'Equals',
        'NotEquals',
        'IsEmpty',
        'IsNotEmpty',
        'IsIn',
        'IsNotIn',
        'IsDivisibleBy',
        'IsPositive',
        'IsNegative',
        'Max',
        'Min',
        'MinDate',
        'MaxDate',
        'Contains',
        'NotContains',
        'IsAlpha',
        'IsAlphanumeric',
        'IsDecimal',
        'IsAscii',
        'IsBase64',
        'IsByteLength',
        'IsCreditCard',
        'IsCurrency',
        'IsEmail',
        'IsFQDN',
        'IsFullWidth',
        'IsHalfWidth',
        'IsVariableWidth',
        'IsHexColor',
        'IsHexadecimal',
        'IsMacAddress',
        'IsIP',
        'IsPort',
        'IsISBN',
        'IsISIN',
        'IsISO8601',
        'IsJSON',
        'IsJWT',
        'IsLowercase',
        'IsMobilePhone',
        'IsISO31661Alpha2',
        'IsISO31661Alpha3',
        'IsMongoId',
        'IsMultibyte',
        'IsSurrogatePair',
        'IsUrl',
        'IsUUID',
        'IsFirebasePushId',
        'IsUppercase',
        'Length',
        'MaxLength',
        'MinLength',
        'Matches',
        'IsPhoneNumber',
        'IsMilitaryTime',
        'IsHash',
        'IsISSN',
        'IsDateString',
        'IsBooleanString',
        'IsNumberString',
        'IsBase32',
        'IsBIC',
        'IsBtcAddress',
        'IsDataURI',
        'IsEAN',
        'IsEthereumAddress',
        'IsHSL',
        'IsIBAN',
        'IsIdentityCard',
        'IsISRC',
        'IsLocale',
        'IsMagnetURI',
        'IsMimeType',
        'IsOctal',
        'IsPassportNumber',
        'IsPostalCode',
        'IsRFC3339',
        'IsRgbColor',
        'IsSemVer',
        'IsStrongPassword',
        'IsTimeZone',
        'IsBase58',
        'id',
        'code',
        'IsBoolean',
        'IsDate',
        'IsNumber',
        'IsEnum',
        'IsInt',
        'IsString',
        'IsArray',
        'IsObject',
        'ArrayContains',
        'ArrayNotContains',
        'ArrayNotEmpty',
        'ArrayMinSize',
        'ArrayMaxSize',
        'ArrayUnique',
        'IsNotEmptyObject',
        'IsInstance',
      ],
    },
  ];

  private decoratorImportMap = new Map<string, string>(
    this.decoratorCategories.flatMap(({ importPath, names }) =>
      names.map((name) => [name, importPath] as [string, string]),
    ),
  );

  verifyIfDecoratorIsValid(decoratorName: string): boolean {
    return this.decoratorImportMap.has(decoratorName);
  }

  verifyDocumentation(doc: string): string {
    const lines = doc.trim().split('\n');
    let result = '';
    for (const line of lines) {
      const match = line.match(/^@(\w+)/);
      if (match && this.decoratorImportMap.has(match[1])) {
        result += `\n${line}`;
      }
    }
    return result;
  }

  getValidatorAndImports(
    decoratorName: string,
  ): ValidDecoratorResult | undefined {
    const importPath = this.decoratorImportMap.get(decoratorName);
    if (!importPath) return undefined;
    return { importPath, decoratorName };
  }
}
