export class ArrayHelper {
  static uniq<T>(input: T[]): T[] {
    return Array.from(new Set(input));
  }

  static concatIntoArray<T>(source: T[], target: T[]): void {
    source.forEach((item) => target.push(item));
  }
}
