import { SmartMergeContentV2 } from '../smart-merge-content-v2';

describe('SmartMergeContentV2', () => {
  let smartMerge: SmartMergeContentV2;

  beforeEach(() => {
    smartMerge = new SmartMergeContentV2();
  });

  describe('merge method', () => {
    it('should return generated text when existing text is empty', () => {
      const existingText = '';
      const generatedText = `
export interface UserDto {
  id: number;
  name: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);
      expect(result).toBe(generatedText);
    });

    it('should return generated text when existing text is only whitespace', () => {
      const existingText = '   \n  \t  ';
      const generatedText = `
export interface UserDto {
  id: number;
  name: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);
      expect(result).toBe(generatedText);
    });

    it('should preserve user-added properties in interfaces', () => {
      const existingText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  // @generated from prisma schema
  name: string;
  // User-added field
  customField: boolean;
}`;

      const generatedText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  // @generated from prisma schema
  name: string;
  // @generated from prisma schema
  email: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain('email: string');
      expect(result).toContain('customField: boolean');
    });

    it('should preserve user-added properties in classes', () => {
      const existingText = `
export class UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  name: string;
  
  // User-added field
  customField: boolean;
}`;

      const generatedText = `
export class UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  name: string;
  
  // @generated from prisma schema
  email: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain('email: string');
      expect(result).toContain('customField: boolean');
    });

    it('should preserve decorators on user-added properties', () => {
      const existingText = `
export class UserDto {
  // @generated from prisma schema
  id: number;
  
  @IsOptional()
  @IsString()
  customField?: string;
  
  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;
}`;

      const generatedText = `
export class UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  name: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain('@IsOptional()');
      expect(result).toContain('@IsString()');
      expect(result).toContain('customField?: string');
      expect(result).toContain('@ValidateNested()');
      expect(result).toContain('@Type(() => ProfileDto)');
      expect(result).toContain('profile: ProfileDto');
    });

    it('should update schema properties when they change', () => {
      const existingText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  name: string;
  
  customField: boolean;
}`;

      const generatedText = `
export interface UserDto {
  // @generated from prisma schema
  id: string; // Type changed from number to string
  
  // @generated from prisma schema
  name: string;
  
  // @generated from prisma schema
  email: string; // New schema field
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: string');
      expect(result).toContain('name: string');
      expect(result).toContain('email: string');
      expect(result).toContain('customField: boolean');
    });

    it('should handle optional properties correctly', () => {
      const existingText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  
  customField?: string;
  requiredCustomField: boolean;
}`;

      const generatedText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  email?: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
      expect(result).toContain('email?: string');
      expect(result).toContain('customField?: string');
      expect(result).toContain('requiredCustomField: boolean');
    });

    it('should handle complex types and generics', () => {
      const existingText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  
  customArray: Array<string>;
  customGeneric: Promise<UserEntity>;
  customUnion: string | number;
}`;

      const generatedText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  tags: string[];
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
      expect(result).toContain('tags: string[]');
      expect(result).toContain('customArray: Array<string>');
      expect(result).toContain('customGeneric: Promise<UserEntity>');
      expect(result).toContain('customUnion: string | number');
    });

    it('should preserve imports when merging', () => {
      const existingText = `
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class TestDto {
  id: number;
}
  
export class UserDto {
  // @generated from prisma schema
  @IsOptional()
  id: number;
  
  @IsOptional()
  @IsString()
  customField?: string;
}`;

      const generatedText = `
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  // @generated from prisma schema
  @ApiProperty()
  id: number;
  
  // @generated from prisma schema
  @ApiProperty()
  name: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain(
        "import { ApiProperty } from '@nestjs/swagger';",
      );
      expect(result).toContain('@ApiProperty()');
      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain('@IsOptional()');
      expect(result).toContain('@IsString()');
      expect(result).toContain('customField?: string');
    });

    it('should handle decorators with complex arguments', () => {
      const existingText = `
export class UserDto {
  // @generated from prisma schema
  id: number;
  
  @Transform(({ value }) => value.toUpperCase())
  @IsString({ message: 'Must be a string' })
  @Length(2, 50, { message: 'Must be between 2 and 50 characters' })
  customField: string;
}`;

      const generatedText = `
export class UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  name: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain(
        '@Transform(({ value }) => value.toUpperCase())',
      );
      expect(result).toContain("@IsString({ message: 'Must be a string' })");
      expect(result).toContain(
        "@Length(2, 50, { message: 'Must be between 2 and 50 characters' })",
      );
      expect(result).toContain('customField: string');
    });

    it('should remove schema fields that are no longer present', () => {
      const existingText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  deprecatedField: string;
  
  customField: boolean;
}`;

      const generatedText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  name: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain('customField: boolean');
      expect(result).not.toContain('deprecatedField');
    });

    it('should handle empty classes and interfaces', () => {
      const existingText = `
export interface UserDto {
}`;

      const generatedText = `
export interface UserDto {
  // @generated from prisma schema
  id: number;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('id: number');
    });

    it('should preserve user fields when no schema fields exist', () => {
      const existingText = `
export interface UserDto {
  customField1: string;
  customField2: number;
}`;

      const generatedText = `
export interface UserDto {
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('customField1: string');
      expect(result).toContain('customField2: number');
    });

    it('should handle mixed field types (schema + user) correctly', () => {
      const existingText = `
export class UserCreateDto {
  // @generated from prisma schema
  name: string;
  
  @IsOptional()
  @IsEmail()
  customEmail?: string;
  
  // @generated from prisma schema
  age: number;
  
  @ValidateNested()
  customProfile: CustomProfile;
}`;

      const generatedText = `
export class UserCreateDto {
  // @generated from prisma schema
  name: string;
  
  // @generated from prisma schema
  age: number;
  
  // @generated from prisma schema
  email: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('name: string');
      expect(result).toContain('age: number');
      expect(result).toContain('email: string');

      expect(result).toContain('@IsOptional()');
      expect(result).toContain('@IsEmail()');
      expect(result).toContain('customEmail?: string');
      expect(result).toContain('@ValidateNested()');
      expect(result).toContain('customProfile: CustomProfile');
    });

    it('should preserve extends and implements in classes and interfaces', () => {
      const existingText = `
export interface BaseDto {
  id: number;
}

export interface UserDto extends BaseDto {
  // @generated from prisma schema
  name: string;
  
  customField: boolean;
}

export class UserCreateDto implements UserDto {
  // @generated from prisma schema
  name: string;
  
  @IsOptional()
  customEmail?: string;
}

export class ExtendedUserDto extends UserCreateDto implements BaseDto {
  // @generated from prisma schema
  id: number;
  
  additionalField: string;
}`;

      const generatedText = `
export interface UserDto {
  // @generated from prisma schema
  name: string;
  
  // @generated from prisma schema
  email: string;
}

export class UserCreateDto {
  // @generated from prisma schema
  name: string;
  
  // @generated from prisma schema
  age: number;
}

export class ExtendedUserDto {
  // @generated from prisma schema
  id: number;
  
  // @generated from prisma schema
  description: string;
}`;

      const result = smartMerge.merge(existingText, generatedText);

      expect(result).toContain('interface UserDto extends BaseDto');
      expect(result).toContain('class UserCreateDto implements UserDto');
      expect(result).toContain(
        'class ExtendedUserDto extends UserCreateDto implements BaseDto',
      );

      expect(result).toContain('email: string');
      expect(result).toContain('age: number');
      expect(result).toContain('description: string');

      expect(result).toContain('customField: boolean');
      expect(result).toContain('@IsOptional()');
      expect(result).toContain('customEmail?: string');
      expect(result).toContain('additionalField: string');
    });
  });
});
