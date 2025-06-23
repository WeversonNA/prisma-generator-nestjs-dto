import { SourceFile, ImportDeclaration } from 'ts-morph';

export class ImportMerger {
  ensureImportsFromDeclaration(file: SourceFile, imp: ImportDeclaration): void {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    for (const named of imp.getNamedImports()) {
      this.ensureImport(file, named.getName(), moduleSpecifier);
    }
  }

  ensureImport(file: SourceFile, named: string, moduleSpecifier: string): void {
    const imp = file.getImportDeclaration(
      (d) => d.getModuleSpecifierValue() === moduleSpecifier,
    );

    if (!imp) {
      file.addImportDeclaration({ namedImports: [named], moduleSpecifier });
    } else if (!imp.getNamedImports().some((n) => n.getName() === named)) {
      imp.addNamedImport(named);
    }
  }

  removeImport(file: SourceFile, named: string, moduleSpecifier: string): void {
    const imp = file.getImportDeclaration(
      (d) => d.getModuleSpecifierValue() === moduleSpecifier,
    );

    if (!imp) return;

    const stillUsed = this.isImportStillUsed(file, named);
    if (stillUsed) return;

    imp.getNamedImports().forEach((n) => {
      if (n.getName() === named) n.remove();
    });

    if (imp.getNamedImports().length === 0) {
      imp.remove();
    }
  }

  private isImportStillUsed(file: SourceFile, importName: string): boolean {
    return file.getFullText().includes(importName);
  }
}
