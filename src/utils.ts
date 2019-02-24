export const isPrimitive = value => value === null || (typeof value !== 'object' && typeof value !== 'function')

export const defaultComparer = (a: any, b: any): boolean => {
  return Object.is(a, b)
}
