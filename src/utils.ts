import { endBatch, startBatch } from './observer'

export function isPrimitive(value: any) {
  return value === null || (typeof value !== 'object' && typeof value !== 'function')
}

export function isNativeMethod(prop: string, method: any) {
  return method === Array.prototype[prop] || method === Object.prototype[prop]
}

export type IEqualsComparer<T> = (a: T, b: T) => boolean

export const defaultComparer = (a: any, b: any): boolean => {
  return Object.is(a, b)
}

export interface Lambda {
  (): void
  name?: string
}

export function once(func: Function): Function {
  let invoked = false
  return function() {
    if (invoked) return
    invoked = true
    /* tslint:disable */
    return (func as any).apply(this, arguments)
  }
}

export function makeFnInTransaction(fn: Function) {
  return new Proxy(fn, {
    apply(target, ctx, args) {
      // AOP: before
      startBatch()
      try {
        return Reflect.apply(target, ctx, args)
      } finally {
        // AOP: after
        endBatch()
      }
    }
  })
}
