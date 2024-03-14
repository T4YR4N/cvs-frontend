export type NonPrimitive = { [key: string]: unknown } | unknown[];
export type NonNullUndefined<T> = Exclude<T, null | undefined>;
export type SafeNonPrimitive = NonNullUndefined<NonPrimitive>;
