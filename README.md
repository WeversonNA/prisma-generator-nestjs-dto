# Prisma Generator NestJS DTO

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/github/license/vegardit/prisma-generator-nestjs-dto.svg?label=license)](#license)

Generates ConnectDTO, CreateDTO, UpdateDTO, and Entity classes from Prisma schema with smart merge capabilities to preserve custom fields and decorators.

## Table of Contents

1. [What is it?](#what-is-it)
2. [Installation & Usage](#installation--usage)  
3. [Configuration](#configuration)
4. [Annotations](#annotations)
5. [Smart Merge System](#smart-merge-system)
6. [Examples](#examples)
7. [License](#license)

## What is it?

Generates `ConnectDTO`, `CreateDTO`, `UpdateDTO`, and `Entity` classes for models in your Prisma Schema. This is useful for [OpenAPI](https://docs.nestjs.com/openapi/introduction) in [NestJS](https://nestjs.com/) applications and GraphQL resources. NestJS Swagger requires input parameters in controllers to be described through classes because it leverages TypeScript's emitted metadata and Reflection to generate OpenAPI spec components.

These classes can also be used with NestJS [ValidationPipe](https://docs.nestjs.com/techniques/validation#using-the-built-in-validationpipe) and [Serialization](https://docs.nestjs.com/techniques/serialization).

### What's New in v2.0.2?

🎉 **Major Release with Breaking Improvements**

- **Smart Merge System**: Automatically preserves custom fields and decorators during regeneration
- **Custom Decorator Config**: Define and use custom decorators with proper import mapping
- **Modular Architecture**: Complete refactoring for better maintainability and extensibility
- **Enhanced Performance**: Optimized generation process and import management
- **Better Type Safety**: Improved TypeScript interfaces and type checking
- **Bug Fixes**: Resolved issues with decorator config propagation and field processing

### Key Features

- **Smart Merge System**: Preserves custom fields and decorators during regeneration
- **Full Annotation Support**: Use Prisma comments to control DTO generation
- **Flexible Configuration**: Customize naming, output structure, and behavior
- **Type Safety**: Full TypeScript support with proper type inference
- **NestJS Integration**: Works seamlessly with Swagger, validation, and serialization

## Installation & Usage

```sh
npm install --save-dev @weverson_na/prisma-generator-nestjs-dto
```

Add the generator to your `schema.prisma`:

```prisma
generator nestjsDto {
  provider = "prisma-generator-nestjs-dto"
  output   = "../src/generated/nestjs-dto"
}
```

Then run:

```sh
npx prisma generate
```

## Configuration

All parameters are optional:

- **`output`**: (default: `"../src/generated/nestjs-dto"`) - Output path relative to your `schema.prisma` file
- **`outputToNestJsResourceStructure`**: (default: `"false"`) - Organize DTOs in NestJS CRUD generator structure
- **`exportRelationModifierClasses`**: (default: `"true"`) - Export extra classes for relationship operations
- **`reExport`**: (default: `"false"`) - Create index.ts files for every folder
- **`createDtoPrefix`**: (default: `"Create"`) - Prefix for CreateDTO classes
- **`updateDtoPrefix`**: (default: `"Update"`) - Prefix for UpdateDTO classes  
- **`dtoSuffix`**: (default: `"Dto"`) - Suffix for DTO classes
- **`entityPrefix`**: (default: `""`) - Prefix for Entity classes
- **`entitySuffix`**: (default: `""`) - Suffix for Entity classes
- **`fileNamingStyle`**: (default: `"camel"`) - File naming style: `"camel"`, `"pascal"`, `"kebab"`, or `"snake"`
- **`classValidation`**: (default: `"false"`) - Add class-validator decorators
- **`addExposePropertyDecorator`**: (default: `"false"`) - Add `@Expose()` decorators for serialization

Example with all options:

```prisma
generator nestjsDto {
  provider                        = "prisma-generator-nestjs-dto"
  output                          = "../src/generated/nestjs-dto"
  outputToNestJsResourceStructure = "true"
  exportRelationModifierClasses   = "true"
  reExport                        = "true"
  createDtoPrefix                 = "Create"
  updateDtoPrefix                 = "Update"
  dtoSuffix                       = "Dto"
  entityPrefix                    = ""
  entitySuffix                    = "Entity"
  fileNamingStyle                 = "kebab"
  classValidation                 = "true"
  addExposePropertyDecorator      = "true"
}
```

## Annotations

Use triple-slash comments in your Prisma schema to control DTO generation:

```prisma
model Post {
  /// @IsDate()
  /// @DtoCreateOptional  
  /// @DtoUpdateHidden
  createdAt DateTime @default(now())
  
  /// @DtoReadOnly
  id String @id @default(uuid())
  
  /// @ApiProperty({ description: "Post title", minLength: 1, maxLength: 100 })
  /// @IsNotEmpty()
  /// @MaxLength(100)
  title String
}
```

### Available Annotations

**Field Visibility:**
- `@DtoReadOnly` - Omits field from CreateDTO and UpdateDTO
- `@DtoEntityHidden` - Omits field from Entity  
- `@DtoCreateOptional` - Makes field optional in CreateDTO
- `@DtoUpdateOptional` - Makes field optional in UpdateDTO

**Relations:**
- `@DtoRelationRequired` - Marks relation as required in Entity
- `@DtoRelationCanCreateOnCreate` - Allow creating related records in CreateDTO
- `@DtoRelationCanConnectOnCreate` - Allow connecting to existing records in CreateDTO
- `@DtoRelationCanCreateOnUpdate` - Allow creating related records in UpdateDTO  
- `@DtoRelationCanConnectOnUpdate` - Allow connecting to existing records in UpdateDTO

**Swagger/OpenAPI:**
- `@ApiProperty` - Pass options directly to Swagger decorator

**Validation:**
- Any class-validator decorator (e.g., `@IsEmail()`, `@MinLength(3)`, `@IsOptional()`)

## Smart Merge System

The Smart Merge System preserves your custom fields and decorators when regenerating DTOs. This allows you to:

1. **Add custom fields** to generated DTOs
2. **Add custom decorators** to any field  
3. **Modify generated properties** without losing changes
4. **Keep custom imports** and configuration

### How it works

Generated fields are marked with `// @generated from prisma schema`:

```typescript
export class CreateUserDto {
  // @generated from prisma schema
  @ApiProperty()
  name: string;

  // @generated from prisma schema  
  @ApiProperty()
  @IsEmail()
  email: string;

  // Custom field - preserved during regeneration
  @ApiProperty({ description: 'Custom validation field' })
  @IsOptional()
  customField?: string;
}
```

### Custom Decorator Configuration

Create a `decorator-config.json` file to define custom decorators:

```json
[
  {
    "importPath": "@example/core",
    "names": ["Component", "Injectable", "Pipe"]
  }
]
```

Then reference it in your schema:

```prisma
generator nestjsDto {
  provider = "prisma-generator-nestjs-dto"
  decoratorConfigPath = "./decorator-config.json"
}
```

### Troubleshooting

**Q: My custom decorators are not being imported correctly**  
A: Make sure you have created a `decorator-config.json` file and referenced it in your Prisma schema with `decoratorConfigPath`. The decorators must be defined in the config file to be recognized.

**Q: Custom fields are not being preserved**  
A: Ensure your custom fields don't have the comment `// @generated from prisma schema`. Only fields with this marker are replaced during regeneration.

**Q: Generation fails with import errors**  
A: Check that all custom decorators in your `decorator-config.json` point to valid packages. Install missing dependencies with `npm install`.

## Examples

### Basic Prisma Schema

```prisma
generator nestjsDto {
  provider = "prisma-generator-nestjs-dto"
  output = "../src/generated"
}

model User {
  /// @DtoReadOnly
  id        String   @id @default(uuid())
  
  /// @ApiProperty({ description: "User's email address" })
  /// @IsEmail()
  email     String   @unique
  
  /// @ApiProperty({ minLength: 2, maxLength: 50 })
  /// @IsNotEmpty()
  name      String
  
  /// @DtoCreateOptional
  /// @DtoUpdateOptional
  createdAt DateTime @default(now())
  
  posts     Post[]
}

model Post {
  id       String @id @default(uuid())
  
  /// @ApiProperty({ minLength: 1, maxLength: 100 })
  title    String
  
  content  String
  
  /// @DtoRelationRequired
  /// @DtoRelationCanConnectOnCreate
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

### Generated Output

**CreateUserDto:**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  // @generated from prisma schema
  @ApiProperty({ description: "User's email address" })
  @IsEmail()
  email: string;

  // @generated from prisma schema
  @ApiProperty({ minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  name: string;

  // @generated from prisma schema
  createdAt?: Date;
}
```

**CreatePostDto:**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { ConnectUserDto } from '../user/dto/connect-user.dto';

export class CreatePostRelationInputDto {
  connect: ConnectUserDto;
}

export class CreatePostDto {
  // @generated from prisma schema
  @ApiProperty({ minLength: 1, maxLength: 100 })
  title: string;

  // @generated from prisma schema
  content: string;

  // @generated from prisma schema
  author: CreatePostRelationInputDto;
}
```

### Smart Merge System Example

Add custom fields that will be preserved during regeneration:

```typescript
// Before regeneration
export class CreateUserDto {
  // @generated from prisma schema
  @ApiProperty()
  email: string;

  // @generated from prisma schema
  @ApiProperty()
  name: string;

  // Custom field - will be preserved
  @ApiProperty({ description: 'Terms acceptance' })
  @IsBoolean()
  acceptTerms: boolean;

  // Custom validation
  @ApiProperty({ description: 'Password confirmation' })
  @IsString()
  @MinLength(8)
  passwordConfirmation: string;
}

// After running npx prisma generate - custom fields are preserved!
export class CreateUserDto {
  // @generated from prisma schema  
  @ApiProperty()
  email: string;

  // @generated from prisma schema
  @ApiProperty()
  name: string;

  // Custom field - preserved during regeneration
  @ApiProperty({ description: 'Terms acceptance' })
  @IsBoolean() 
  acceptTerms: boolean;

  // Custom validation - preserved during regeneration
  @ApiProperty({ description: 'Password confirmation' })
  @IsString()
  @MinLength(8)
  passwordConfirmation: string;
}
```

## License

All files are released under the [Apache License 2.0](https://github.com/vegardit/prisma-generator-nestjs-dto/blob/master/LICENSE).

## Contributing

We welcome contributions! Please feel free to:
- Report issues
- Submit feature requests  
- Contribute code improvements

### Development

```bash
# Clone the repository
git clone https://github.com/WeversonNA/prisma-generator-nestjs-dto.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Test with a Prisma schema
npx prisma generate
```

---

## Acknowledgments

This project builds upon the excellent foundation provided by the original `@vegardit/prisma-generator-nestjs-dto` project.
