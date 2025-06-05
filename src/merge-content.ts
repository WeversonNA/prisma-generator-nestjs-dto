import {
  Project,
  SourceFile,
  SyntaxKind,
  ClassDeclaration,
  ImportDeclaration,
  PropertyDeclaration,
} from 'ts-morph';
import { DecoratorStrategy } from './generator/decorator-strategy';

export class MergeContent {
  private readonly decoratorStrategy: DecoratorStrategy =
    new DecoratorStrategy();

  merge(existingText: string, generatedText: string): string {
    const project = new Project({ useInMemoryFileSystem: true });
    const existsFile = project.createSourceFile('exists.ts', existingText);
    const genFile = project.createSourceFile('gen.ts', generatedText);

    for (const genCls of genFile.getClasses()) {
      this.mergeClass(existsFile, genCls);
    }

    for (const imp of genFile.getImportDeclarations()) {
      this.ensureImportsFromDeclaration(existsFile, imp);
    }

    return existsFile.getFullText();
  }

  private mergeClass(file: SourceFile, genCls: ClassDeclaration): void {
    const name = genCls.getName() || '';
    const existCls = file.getClass(name);
    if (!existCls) {
      file.addStatements(genCls.getText());
      return;
    }
    this.mergeProperties(existCls, genCls);
  }

  private addDecorators(
    existProp: PropertyDeclaration,
    genProp: PropertyDeclaration,
  ): void {
    const genDecorators = genProp.getDecorators();
    const existDecorators = existProp.getDecorators().map((d) => d.getName());

    for (const genDec of genDecorators) {
      const name = genDec.getName();
      const valid = this.decoratorStrategy.verifyIfDecoratorIsValid(name);
      if (!valid) continue;
      if (existDecorators.includes(name)) {
        existProp.getDecorator(name)?.remove();
      }

      existProp.addDecorator({
        name,
        arguments: genDec.getArguments().map((a) => a.getText()),
      });
      const getValidatorAndImports =
        this.decoratorStrategy.getValidatorAndImports(name);
      if (!getValidatorAndImports?.importPath) continue;

      this.ensureImport(
        existProp.getSourceFile(),
        name,
        getValidatorAndImports.importPath,
      );
    }
  }

  private mergeProperties(
    existCls: ClassDeclaration,
    genCls: ClassDeclaration,
  ): void {
    const genProps = genCls.getProperties();
    const genNames = genProps.map((p) => p.getName());

    // add or update
    for (const genProp of genProps) {
      const name = genProp.getName();
      const existProp = existCls.getProperty(name);
      if (!existProp) {
        existCls.addMember(genProp.getText());

        const addedProp = existCls.getProperty(name);

        if (!addedProp) continue;
        this.addDecorators(addedProp, genProp);
      } else {
        this.updatePropertyType(existProp, genProp);
        this.addDecorators(existProp, genProp);
      }
    }

    // remove old
    for (const existProp of existCls.getProperties()) {
      const name = existProp.getName();
      if (!genNames.includes(name)) {
        for (const dec of existProp.getDecorators()) {
          this.removeImport(
            existCls.getSourceFile(),
            dec.getName(),
            '@nestjs/swagger',
          );
        }
        existProp.remove();
      }
    }
  }

  private updatePropertyType(
    existProp: PropertyDeclaration,
    genProp: PropertyDeclaration,
  ): void {
    const oldType = existProp.getTypeNode()?.getText();
    const newType = genProp.getTypeNode()?.getText();
    if (newType && oldType !== newType) {
      existProp.setType(newType);
    }
  }

  private ensureImportsFromDeclaration(
    file: SourceFile,
    imp: ImportDeclaration,
  ): void {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    for (const named of imp.getNamedImports()) {
      this.ensureImport(file, named.getName(), moduleSpecifier);
    }
  }

  private ensureImport(
    file: SourceFile,
    named: string,
    moduleSpecifier: string,
  ): void {
    const imp = file.getImportDeclaration(
      (d) => d.getModuleSpecifierValue() === moduleSpecifier,
    );
    if (!imp) {
      file.addImportDeclaration({ namedImports: [named], moduleSpecifier });
    } else if (!imp.getNamedImports().some((n) => n.getName() === named)) {
      imp.addNamedImport(named);
    }
  }

  private removeImport(
    file: SourceFile,
    named: string,
    moduleSpecifier: string,
  ): void {
    const imp = file.getImportDeclaration(
      (d) => d.getModuleSpecifierValue() === moduleSpecifier,
    );
    if (!imp) return;
    const stillUsed = file
      .getDescendantsOfKind(SyntaxKind.Decorator)
      .some((dec) => dec.getName() === named);
    if (stillUsed) return;
    imp.getNamedImports().forEach((n) => {
      if (n.getName() === named) n.remove();
    });
    if (imp.getNamedImports().length === 0) imp.remove();
  }
}
