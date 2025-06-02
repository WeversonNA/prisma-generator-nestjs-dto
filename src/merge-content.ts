import { Project, SourceFile, SyntaxKind } from 'ts-morph';

export class MergeContent {
  merge(existingText: string, generatedText: string): string {
    const project = new Project({ useInMemoryFileSystem: true });
    const existsFile = project.createSourceFile('exists.ts', existingText);
    const genFile = project.createSourceFile('gen.ts', generatedText);

    genFile.getClasses().forEach((genCls) => {
      const name = genCls.getName();
      const existCls = existsFile.getClass(name ?? '');
      if (!existCls) {
        existsFile.addStatements(genCls.getText());
        return;
      }
      genCls.getProperties().forEach((genProp) => {
        const propName = genProp.getName();
        const existProp = existCls.getProperty(propName);
        if (!existProp) {
          existCls.addMember(genProp.getText());
          genProp.getDecorators().forEach((dec) => {
            this.ensureImport(existsFile, dec.getName(), '@nestjs/swagger');
          });
        } else {
          const oldType = existProp.getTypeNode()?.getText();
          const newType = genProp.getTypeNode()?.getText();
          if (oldType !== newType) {
            existProp.setType(newType || 'any');
          }

          const genApiProp = genProp.getDecorator('ApiProperty');
          if (genApiProp) {
            const existApiProp = existProp.getDecorator('ApiProperty');
            if (existApiProp) existApiProp.remove();
            existProp.addDecorator({
              name: 'ApiProperty',
              arguments: genApiProp.getArguments().map((arg) => arg.getText()),
            });
            this.ensureImport(existsFile, 'ApiProperty', '@nestjs/swagger');
          }
        }
      });

      const genNames = genCls.getProperties().map((p) => p.getName());
      existCls.getProperties().forEach((existProp) => {
        const propName = existProp.getName();
        if (!genNames.includes(propName)) {
          existProp.getDecorators().forEach((dec) => {
            const decName = dec.getName();
            const moduleSpecifier = '@nestjs/swagger';
            this.removeImport(existsFile, decName, moduleSpecifier);
          });
          existProp.remove();
        }
      });
    });

    genFile.getImportDeclarations().forEach((imp) => {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      imp.getNamedImports().forEach((named) => {
        this.ensureImport(existsFile, named.getName(), moduleSpecifier);
      });
    });

    return existsFile.getFullText();
  }

  private ensureImport(
    file: SourceFile,
    named: string,
    moduleSpecifier: string,
  ) {
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
  ) {
    const imp = file.getImportDeclaration(
      (d) => d.getModuleSpecifierValue() === moduleSpecifier,
    );
    if (!imp) return;

    const isUsed = file
      .getDescendantsOfKind(SyntaxKind.Decorator)
      .some((dec) => dec.getName() === named);
    if (isUsed) return;

    imp.getNamedImports().forEach((n) => {
      if (n.getName() === named) n.remove();
    });
    if (imp.getNamedImports().length === 0) imp.remove();
  }
}
