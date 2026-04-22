export type DeepKeyOf<T> = T extends object
  ? { [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${DeepKeyOf<T[K]>}`}` }[keyof T]
  : never

export type DeepValueOf<T, K extends DeepKeyOf<T>> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends DeepKeyOf<T[Key]>
      ? DeepValueOf<T[Key], Rest>
      : never
    : never
  : K extends keyof T
    ? T[K]
    : never
