export type Resolved<T> = {
  "0": { [K in keyof T]: T[K] };
}["0"];

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export interface DeepRecord<T> {
  [key: string]: T | DeepRecord<T>;
}

export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

export function is(x: unknown, y: unknown): boolean {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
}

export function mergeObjects<T>(
  target: DeepRecord<T>,
  source: DeepRecord<T>,
  fn?: (
    item: T,
    key: string,
    parent: DeepRecord<T>,
    paths: readonly string[]
  ) => void,
  paths: string[] = []
): DeepRecord<T> {
  if (!isPlainObject(target)) {
    throw new Error("`target` is not an object.");
  }

  if (!isPlainObject(source)) {
    throw new Error("`source` is not an object.");
  }

  Object.keys(source).forEach((key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }

    paths.push(key);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const sourceItem = source[key]!;
    if (isPlainObject(sourceItem)) {
      if (target[key] === undefined) {
        target[key] = {};
      }

      const targetItem = target[key];
      if (!isPlainObject(targetItem)) {
        throw new Error('`target["${key}"]` is not an object.');
      }

      mergeObjects(targetItem, sourceItem, fn, paths);
    } else {
      if (fn) {
        fn(sourceItem, key, target, paths);
      } else {
        target[key] = sourceItem;
      }
    }

    paths.pop();
  });

  return target;
}

export function flattenObject<T>(
  obj: DeepRecord<T>,
  separator = "."
): Record<string, T> {
  const result: Record<string, T> = {};

  mergeObjects({}, obj, (item, _key, _parent, paths) => {
    result[paths.join(separator)] = item;
  });

  return result;
}

export function concatLastString(
  str: string,
  lastStr: string | undefined,
  separator = "/"
): string {
  if (!lastStr) {
    return str;
  }

  if (!str) {
    return lastStr;
  }

  return `${str}${separator}${lastStr}`;
}

export function splitLastString(
  str: string,
  separator = "/"
): [string, string] {
  const index = str.lastIndexOf(separator);
  return index >= 0
    ? [str.substring(0, index), str.substring(index + 1)]
    : ["", str];
}

export function defineGetter<TObject, TKey extends keyof TObject>(
  obj: TObject,
  p: TKey,
  get: () => TObject[TKey]
): void {
  Object.defineProperty(obj, p, {
    get,
    enumerable: false,
    configurable: true,
  });
}
