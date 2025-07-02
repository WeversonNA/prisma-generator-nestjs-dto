import type {
  ClassDeclaration,
  ImportDeclaration,
  PropertyDeclaration,
  PropertySignature,
  SourceFile,
} from 'ts-morph';
import { Node, Project } from 'ts-morph';

type FieldMetadata = {
  decorators: string[];
  generated: boolean;
  type: string;
  optional: boolean;
};
/**
 * Enhanced merge that preserves user fields while syncing schema fields.
 * Uses ts-morph for more reliable AST manipulation.
 */
export class SmartMergeContentV2 {
  private readonly SCHEMA_MARKER = '// @generated from prisma schema';
  private readonly IGNORE = '// @ignore';
  private readonly IMPORTS = new Map<string, string[]>();
  private readonly CLASSES = new Map<string, Map<string, FieldMetadata>>();
  private readonly ENUMS = new Map<string, string[]>();
  private readonly TYPES = new Map<string, string>();
  private readonly INTERFACES = new Map<string, Map<string, FieldMetadata>>();
  private readonly FUNCTIONS = new Map<string, string>();
  private readonly CONSTRUCTORS = new Map<string, string[]>();
  private readonly CLASS_EXTENDS = new Map<string, string>();
  private readonly CLASS_IMPLEMENTS = new Map<string, string[]>();
  private readonly INTERFACE_EXTENDS = new Map<string, string[]>();
  /**
   * Map to store class decorators
   * @first_key className
   * @second_key Map of decorator name to object with hasArgs and args Set
   */
  private readonly CLASS_DECORATORS = new Map<
    string,
    Map<string, { hasArgs: boolean; args: Set<string> }>
  >();

  merge(existingText: string, generatedText: string): string {
    if (!existingText.trim()) {
      return generatedText;
    }

    const project = new Project({ useInMemoryFileSystem: true });

    const existingFile = project.createSourceFile('existing.ts', existingText);
    const generatedFile = project.createSourceFile(
      'generated.ts',
      generatedText,
    );
    this.setFileImports(existingFile);
    this.setFileImports(generatedFile);

    this.setEnums(existingFile);
    this.setEnums(generatedFile);

    this.setInterfaces(existingFile);
    this.setInterfaces(generatedFile);

    this.setFunctions(existingFile);
    this.setFunctions(generatedFile);

    this.setConstructors(existingFile);
    this.setConstructors(generatedFile);

    this.setTypes(existingFile);
    this.setTypes(generatedFile);

    this.setClasses(existingFile);
    this.setClasses(generatedFile);

    this.setClassDecorators(existingFile);
    this.setClassDecorators(generatedFile);

    const newContent = this.generateFileFromCollectedData();

    return newContent;
  }

  private setClassDecorators(file: SourceFile): void {
    const classes = file.getClasses();

    classes.forEach((classDeclaration) => {
      const className = classDeclaration.getName() || '';
      const decorators = classDeclaration.getDecorators();

      if (!this.CLASS_DECORATORS.has(className)) {
        this.CLASS_DECORATORS.set(
          className,
          new Map<string, { hasArgs: boolean; args: Set<string> }>(),
        );
      }

      const classDecorators = this.CLASS_DECORATORS.get(className)!;

      decorators.forEach((decorator) => {
        const decoratorName = decorator.getName();
        const args = decorator.getArguments().map((arg) => arg.getText());

        if (!classDecorators.has(decoratorName)) {
          classDecorators.set(decoratorName, {
            hasArgs: args.length > 0,
            args: new Set<string>(),
          });
        }

        const decoratorInfo = classDecorators.get(decoratorName)!;

        if (args.length === 0) {
          decoratorInfo.hasArgs = false;
        } else {
          decoratorInfo.hasArgs = true;
          args.forEach((arg) => {
            decoratorInfo.args.add(arg);
          });
        }
      });
    });
  }

  private setTypes(existingFile: SourceFile): void {
    const typeAliases = existingFile.getTypeAliases();

    typeAliases.forEach((typeAlias) => {
      const typeName = typeAlias.getName() || '';
      const typeDefinition = typeAlias.getTypeNode()?.getText() || '';

      this.TYPES.set(typeName, typeDefinition);
    });
  }

  private setInterfaces(file: SourceFile): void {
    const interfaces = file.getInterfaces();

    interfaces.forEach((interfaceDeclaration) => {
      const interfaceName = interfaceDeclaration.getName() || '';
      const properties = interfaceDeclaration.getProperties();

      const extendsTypes = interfaceDeclaration
        .getExtends()
        .map((extend) => extend.getText());
      if (extendsTypes.length > 0) {
        this.INTERFACE_EXTENDS.set(interfaceName, extendsTypes);
      }

      const newProperties = new Map<string, FieldMetadata>();

      properties.forEach((property) => {
        const propertyName = property.getName();
        const propertyType = property.getTypeNode()?.getText() || 'any';
        const hasQuestionToken = property.hasQuestionToken();

        const leadingComments = property.getLeadingCommentRanges();
        const decorators = leadingComments.map((comment) =>
          comment.getText().trim(),
        );

        const key = propertyName + (hasQuestionToken ? '?' : '');
        newProperties.set(key, {
          decorators,
          type: propertyType,
          generated: this.isSchemaGenerated(property),
          optional: hasQuestionToken,
        });
      });

      this.mergeInterfaceProperties(interfaceName, newProperties);
    });
  }

  private mergeInterfaceProperties(
    interfaceName: string,
    newProperties: Map<string, FieldMetadata>,
  ): void {
    const existingProperties =
      this.INTERFACES.get(interfaceName) || new Map<string, FieldMetadata>();

    if (existingProperties.size === 0) {
      this.INTERFACES.set(interfaceName, newProperties);
      return;
    }

    const isProcessingGenerated =
      this.isProcessingGeneratedProperties(newProperties);

    if (isProcessingGenerated) {
      this.updateGeneratedInterfaceProperties(
        existingProperties,
        newProperties,
      );
    } else {
      this.updateExistingInterfaceProperties(existingProperties, newProperties);
    }

    this.INTERFACES.set(interfaceName, existingProperties);
  }

  private isProcessingGeneratedProperties(
    properties: Map<string, FieldMetadata>,
  ): boolean {
    let generatedCount = 0;
    let totalCount = 0;

    properties.forEach((metadata) => {
      totalCount++;
      if (metadata.generated) {
        generatedCount++;
      }
    });

    return totalCount > 0 && generatedCount === totalCount;
  }

  private updateGeneratedInterfaceProperties(
    existingProperties: Map<string, FieldMetadata>,
    newGeneratedProperties: Map<string, FieldMetadata>,
  ): void {
    const keysToRemove: string[] = [];
    existingProperties.forEach((metadata, key) => {
      if (metadata.generated && !newGeneratedProperties.has(key)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      existingProperties.delete(key);
    });

    newGeneratedProperties.forEach((newMetadata, key) => {
      existingProperties.set(key, newMetadata);
    });
  }

  private updateExistingInterfaceProperties(
    existingProperties: Map<string, FieldMetadata>,
    newProperties: Map<string, FieldMetadata>,
  ): void {
    newProperties.forEach((newValue, key) => {
      const existingValue = existingProperties.get(key);

      if (!existingValue) {
        existingProperties.set(key, newValue);
        return;
      }

      const combinedDecorators = [
        ...new Set([...existingValue.decorators, ...newValue.decorators]),
      ];

      existingProperties.set(key, {
        decorators: combinedDecorators,
        type: newValue.type || existingValue.type,
        generated: newValue.generated || existingValue.generated,
        optional: newValue.optional || existingValue.optional,
      });
    });
  }

  private setFunctions(file: SourceFile): void {
    const functions = file.getFunctions();

    functions.forEach((func) => {
      const functionName = func.getName() || '';
      const functionText = func.getText();

      this.FUNCTIONS.set(functionName, functionText);
    });
  }

  private setConstructors(file: SourceFile): void {
    const classes = file.getClasses();

    classes.forEach((cls) => {
      const className = cls.getName() || '';
      const constructors = cls.getConstructors();

      const constructorTexts = constructors.map((constructor) =>
        constructor.getText(),
      );

      if (constructorTexts.length > 0) {
        this.CONSTRUCTORS.set(className, constructorTexts);
      }
    });
  }

  private setEnums(file: SourceFile): void {
    const enums = file.getEnums();

    enums.forEach((enumDeclaration) => {
      const enumName = enumDeclaration.getName() || '';
      const enumMembers = enumDeclaration
        .getMembers()
        .map((member) => member.getName());

      this.ENUMS.set(enumName, enumMembers);
    });
  }

  private setClasses(file: SourceFile): void {
    const classes = file.getClasses();

    classes.forEach((cls: ClassDeclaration) => {
      const className = cls.getName() || '';
      const properties = cls.getProperties();

      const extendsClause = cls.getExtends();
      if (extendsClause) {
        this.CLASS_EXTENDS.set(className, extendsClause.getText());
      }

      const implementsTypes = cls.getImplements().map((impl) => impl.getText());
      if (implementsTypes.length > 0) {
        this.CLASS_IMPLEMENTS.set(className, implementsTypes);
      }

      const newProperties = new Map<string, FieldMetadata>();
      properties.forEach((property) => {
        const key = this.getPropertyName(property);
        const decorators = this.extractDecorators(property);
        const type = this.getPropertyType(property);
        const hasQuestionToken = property.hasQuestionToken();

        newProperties.set(key, {
          decorators,
          type,
          generated: this.isSchemaGenerated(property),
          optional: hasQuestionToken,
        });
      });

      this.mergeClassProperties(className, newProperties);
    });
  }

  private mergeClassProperties(
    className: string,
    newProperties: Map<string, FieldMetadata>,
  ): void {
    const existingProperties =
      this.CLASSES.get(className) || new Map<string, FieldMetadata>();

    if (existingProperties.size === 0) {
      this.CLASSES.set(className, newProperties);
      return;
    }

    const isProcessingGenerated =
      this.isProcessingGeneratedProperties(newProperties);

    if (isProcessingGenerated) {
      this.updateGeneratedClassProperties(existingProperties, newProperties);
    } else {
      this.updateExistingClassProperties(existingProperties, newProperties);
    }

    this.CLASSES.set(className, existingProperties);
  }

  private updateGeneratedClassProperties(
    existingProperties: Map<string, FieldMetadata>,
    newGeneratedProperties: Map<string, FieldMetadata>,
  ): void {
    const keysToRemove: string[] = [];
    existingProperties.forEach((metadata, key) => {
      if (metadata.generated && !newGeneratedProperties.has(key)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      existingProperties.delete(key);
    });

    newGeneratedProperties.forEach((newMetadata, key) => {
      existingProperties.set(key, newMetadata);
    });
  }

  private updateExistingClassProperties(
    existingProperties: Map<string, FieldMetadata>,
    newProperties: Map<string, FieldMetadata>,
  ): void {
    newProperties.forEach((newValue, key) => {
      const existingValue = existingProperties.get(key);

      if (!existingValue) {
        existingProperties.set(key, newValue);
        return;
      }

      const combinedDecorators = [
        ...new Set([...existingValue.decorators, ...newValue.decorators]),
      ];

      existingProperties.set(key, {
        decorators: combinedDecorators,
        type: newValue.type || existingValue.type,
        generated: newValue.generated || existingValue.generated,
        optional: newValue.optional || existingValue.optional,
      });
    });
  }

  private setFileImports(file: SourceFile): void {
    const imports = file.getImportDeclarations();

    imports.forEach((imp: ImportDeclaration) => {
      const moduleSpecifier = imp.getModuleSpecifierValue();

      const namedImports = imp.getNamedImports().map((ni) => ni.getName());

      const defaultImport = imp.getDefaultImport()?.getText();

      const namespaceImport = imp.getNamespaceImport()?.getText();

      this.IMPORTS.set(moduleSpecifier, [
        ...(this.IMPORTS.get(moduleSpecifier) || []),
        ...((namedImports.length > 0 && namedImports) as string[]),
        ...(defaultImport ? [defaultImport] : []),
        ...(namespaceImport ? [namespaceImport] : []),
      ]);
    });
  }

  private getPropertyName(
    property: PropertySignature | PropertyDeclaration,
  ): string {
    if (Node.isPropertySignature(property)) {
      return property.getName();
    } else if (Node.isPropertyDeclaration(property)) {
      return property.getName();
    }
    return '';
  }

  private getPropertyType(
    property: PropertySignature | PropertyDeclaration,
  ): string {
    const typeNode = property.getTypeNode();
    return typeNode ? typeNode.getText() : 'any';
  }

  private extractDecorators(
    property: PropertySignature | PropertyDeclaration,
  ): string[] {
    const decorators: string[] = [];

    if (Node.isPropertyDeclaration(property)) {
      for (const decorator of property.getDecorators()) {
        decorators.push(decorator.getText());
      }
    }

    return decorators;
  }

  private isSchemaGenerated(
    property: PropertySignature | PropertyDeclaration,
  ): boolean {
    const leadingComments = property.getLeadingCommentRanges();
    return leadingComments.some((comment) =>
      comment.getText().includes(this.SCHEMA_MARKER),
    );
  }

  private generateFileFromCollectedData(): string {
    const sections: string[] = [];

    sections.push(this.generateImports());
    sections.push(this.generateTypes());
    sections.push(this.generateEnums());
    sections.push(this.generateInterfaces());
    sections.push(this.generateClasses());
    sections.push(this.generateFunctions());

    return sections.filter((section) => section.trim()).join('\n\n');
  }

  private generateImports(): string {
    if (this.IMPORTS.size === 0) return '';

    const importLines: string[] = [];

    this.IMPORTS.forEach((imports, module) => {
      const uniqueImports = [...new Set(imports)];
      if (uniqueImports.length > 0) {
        importLines.push(
          `import { ${uniqueImports.join(', ')} } from '${module}';`,
        );
      }
    });

    return importLines.join('\n');
  }

  private generateTypes(): string {
    if (this.TYPES.size === 0) return '';

    const typeLines: string[] = [];

    this.TYPES.forEach((definition, name) => {
      typeLines.push(`type ${name} = ${definition};`);
    });

    return typeLines.join('\n');
  }

  private generateEnums(): string {
    if (this.ENUMS.size === 0) return '';

    const enumLines: string[] = [];

    this.ENUMS.forEach((members, name) => {
      enumLines.push(`enum ${name} {`);
      members.forEach((member) => {
        enumLines.push(`  ${member},`);
      });
      enumLines.push('}');
    });

    return enumLines.join('\n');
  }

  private generateInterfaces(): string {
    if (this.INTERFACES.size === 0) return '';

    const interfaceLines: string[] = [];

    this.INTERFACES.forEach((properties, name) => {
      const extendsTypes = this.INTERFACE_EXTENDS.get(name);
      const extendsClause =
        extendsTypes && extendsTypes.length > 0
          ? ` extends ${extendsTypes.join(', ')}`
          : '';

      interfaceLines.push(`export interface ${name}${extendsClause} {`);

      properties.forEach((metadata, propertyName) => {
        const cleanPropertyName = propertyName.replace('?', '');
        const optional = metadata.optional ? '?' : '';
        const generatedComment = metadata.generated
          ? '  // @generated from prisma schema\n'
          : '';

        interfaceLines.push(
          `${generatedComment}  ${cleanPropertyName}${optional}: ${metadata.type};`,
        );
      });

      interfaceLines.push('}');
    });

    return interfaceLines.join('\n');
  }

  private generateClasses(): string {
    if (this.CLASSES.size === 0) return '';

    const classLines: string[] = [];

    this.CLASSES.forEach((properties, className) => {
      const classDecorators = this.CLASS_DECORATORS.get(className);
      if (classDecorators && classDecorators.size > 0) {
        classDecorators.forEach((decoratorInfo, decoratorName) => {
          if (decoratorInfo.hasArgs && decoratorInfo.args.size > 0) {
            const allArgs = Array.from(decoratorInfo.args).join(', ');
            classLines.push(`@${decoratorName}(${allArgs})`);
          } else {
            classLines.push(`@${decoratorName}()`);
          }
        });
      }

      const extendsClause = this.CLASS_EXTENDS.get(className);
      const implementsTypes = this.CLASS_IMPLEMENTS.get(className);

      let classDeclaration = `export class ${className}`;

      if (extendsClause) {
        classDeclaration += ` extends ${extendsClause}`;
      }

      if (implementsTypes && implementsTypes.length > 0) {
        classDeclaration += ` implements ${implementsTypes.join(', ')}`;
      }

      classDeclaration += ' {';
      classLines.push(classDeclaration);

      const constructors = this.CONSTRUCTORS.get(className);
      if (constructors && constructors.length > 0) {
        constructors.forEach((constructor) => {
          classLines.push(`  ${constructor}`);
        });
        classLines.push('');
      }

      properties.forEach((metadata, propertyName) => {
        const optional = metadata.optional ? '?' : '';
        const generatedComment = metadata.generated
          ? '  // @generated from prisma schema'
          : '';

        if (generatedComment) {
          classLines.push(generatedComment);
        }

        metadata.decorators.forEach((decorator) => {
          classLines.push(`  ${decorator}`);
        });

        classLines.push(`  ${propertyName}${optional}: ${metadata.type};`);

        classLines.push('');
      });

      if (classLines[classLines.length - 1] === '') {
        classLines.pop();
      }
      classLines.push('}');
    });

    return classLines.join('\n');
  }

  private generateFunctions(): string {
    if (this.FUNCTIONS.size === 0) return '';

    const functionLines: string[] = [];

    this.FUNCTIONS.forEach((functionText) => {
      functionLines.push(functionText);
    });

    return functionLines.join('\n\n');
  }
}
