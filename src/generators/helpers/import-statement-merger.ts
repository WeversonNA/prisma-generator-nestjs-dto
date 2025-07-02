import type { ImportStatementParams } from '../types';

export class ImportStatementMerger {
  static mergeImportStatements(
    first: ImportStatementParams,
    second: ImportStatementParams,
  ): ImportStatementParams {
    if (first.from !== second.from) {
      throw new Error(`Cannot merge import statements; 'from' differs`);
    }
    if (first.default && second.default) {
      throw new Error(`Cannot merge import statements; both have default`);
    }

    const firstDestruct = first.destruct || [];
    const secondDestruct = second.destruct || [];
    const destructStrings = this.getUniqueStrings([
      ...firstDestruct,
      ...secondDestruct,
    ]);

    const destructObject = this.mergeDestructObjects([
      ...firstDestruct,
      ...secondDestruct,
    ]);

    return {
      ...first,
      ...second,
      destruct: [...destructStrings, destructObject],
    };
  }

  static zipImportStatementParams(
    items: ImportStatementParams[],
  ): ImportStatementParams[] {
    const map = items.reduce(
      (acc, item) => {
        const existing = acc[item.from];
        acc[item.from] = existing
          ? ImportStatementMerger.mergeImportStatements(existing, item)
          : item;
        return acc;
      },
      {} as Record<string, ImportStatementParams>,
    );
    return Object.values(map);
  }

  private static getUniqueStrings(
    destructItems: (string | Record<string, string>)[],
  ): string[] {
    return Array.from(
      new Set(destructItems.filter((x) => typeof x === 'string')),
    );
  }

  private static mergeDestructObjects(
    destructItems: (string | Record<string, string>)[],
  ): Record<string, string> {
    return destructItems.reduce(
      (result: Record<string, string>, destructItem) => {
        if (typeof destructItem === 'string') return result;
        return { ...result, ...destructItem };
      },
      {} as Record<string, string>,
    );
  }
}
