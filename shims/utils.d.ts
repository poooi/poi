export type DeepKeyOf<T> = T extends readonly unknown[]
  ? never
  : T extends (...args: never[]) => unknown
    ? never
    : T extends EventTarget
      ? never
      : string extends keyof T
        ? string
        : T extends object
          ? {
              [K in keyof T]-?: `${Exclude<K, symbol>}${'' | `.${DeepKeyOf<NonNullable<T[K]>>}`}`
            }[keyof T]
          : never

export type DeepKeyOfArray<T> = T extends readonly unknown[]
  ? never
  : T extends (...args: never[]) => unknown
    ? never
    : T extends EventTarget
      ? never
      : string extends keyof T
        ? [string]
        : T extends object
          ? {
              [K in keyof T]: readonly [K] | readonly [K, ...DeepKeyOfArray<NonNullable<T[K]>>]
            }[keyof T]
          : never

export type DeepValueOf<T, K extends DeepKeyOf<T>> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends DeepKeyOf<NonNullable<T[Key]>>
      ? DeepValueOf<NonNullable<T[Key]>, Rest>
      : never
    : never
  : K extends keyof T
    ? T[K]
    : never

export type DeepValueOfArray<T, K extends DeepKeyOfArray<T>> = K extends readonly [
  infer Key,
  ...infer Rest,
]
  ? Key extends keyof T
    ? Rest extends DeepKeyOfArray<NonNullable<T[Key]>>
      ? DeepValueOfArray<NonNullable<T[Key]>, Rest>
      : T[Key]
    : never
  : never

export type NoPeriod<S extends string> = S extends `${string}.${string}` ? never : S
