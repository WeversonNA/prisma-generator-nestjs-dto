import { SourceFile, ClassDeclaration, PropertyDeclaration } from 'ts-morph';

export class ClassMerger {
  mergeClass(file: SourceFile, genCls: ClassDeclaration): void {
    const name = genCls.getName() || '';
    const existCls = file.getClass(name);

    if (!existCls) {
      file.addStatements(genCls.getText());
      return;
    }

    this.mergeProperties(existCls, genCls);
  }

  private mergeProperties(
    existCls: ClassDeclaration,
    genCls: ClassDeclaration,
  ): void {
    const genProps = genCls.getProperties();
    const genNames = genProps.map((p) => p.getName());

    this.addOrUpdateProperties(existCls, genProps);

    this.removeObsoleteProperties(existCls, genNames);
  }

  private addOrUpdateProperties(
    existCls: ClassDeclaration,
    genProps: PropertyDeclaration[],
  ): void {
    for (const genProp of genProps) {
      const name = genProp.getName();
      const existProp = existCls.getProperty(name);

      if (!existProp) {
        existCls.addMember(genProp.getText());
      } else {
        this.updatePropertyType(existProp, genProp);
      }
    }
  }

  private removeObsoleteProperties(
    existCls: ClassDeclaration,
    genNames: string[],
  ): void {
    for (const existProp of existCls.getProperties()) {
      const name = existProp.getName();
      if (!genNames.includes(name)) {
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
}
