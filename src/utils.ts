export const isPrimitive = value => value === null || (typeof value !== 'object' && typeof value !== 'function')

export const defaultComparer = (a: any, b: any): boolean => {
  return Object.is(a, b)
}

export interface Lambda {
  (): void
  name?: string
}

export function once(func: Lambda): Lambda {
  let invoked = false
  return function() {
    if (invoked) return
    invoked = true
    /* tslint:disable */
    return (func as any).apply(this, arguments)
  }
}
