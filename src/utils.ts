import Atom from './Atom'
import { createComputed } from './computed'
import { observable } from './observable'

// import { endBatch, startBatch } from './observer'

export function isPrimitive(value: any) {
  return value === null || (typeof value !== 'object' && typeof value !== 'function')
}

export interface Lambda {
  (): void
  name?: string
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

export const OBFUSCATED_ERROR =
  'An invariant failed, however the error is obfuscated because this is an production build.'

export function invariant(check: false, message?: string | boolean): never
export function invariant(check: any, message?: string | boolean): void
export function invariant(check: boolean, message?: string | boolean) {
  if (!check) throw new Error('[tinar] ' + (message || OBFUSCATED_ERROR))
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

// export function makeFnInTransaction(fn: Function) {
//   return new Proxy(fn, {
//     apply(target, ctx, args) {
//       // AOP: before
//       startBatch()
//       try {
//         return Reflect.apply(target, ctx, args)
//       } finally {
//         // AOP: after
//         endBatch()
//       }
//     }
//   })
// }

export function aopFn(targetFn: Function, beforeFn: Function, afterFn: Function) {
  return new Proxy(targetFn, {
    apply(target, ctx, args) {
      // AOP: before
      beforeFn()
      try {
        return Reflect.apply(target, ctx, args)
      } finally {
        // AOP: after
        afterFn()
      }
    }
  })
}

export function aopFn2(targetFn: Function, beforeFn: Function, afterFn: Function, atom: Atom) {
  return new Proxy(targetFn, {
    apply(target, ctx, args) {
      // AOP: before
      beforeFn()
      try {
        const res = Reflect.apply(target, ctx, args)
        // const length = ctx.length
        // const i0 = ctx[0]
        // const i1 = ctx[1]
        // const bb = ctx === atom.proxy
        // const cc = target === targetFn
        // const res = Reflect.apply(Array.prototype.filter, ctx, [
        //   item => {
        //     console.log(item)
        //   }
        // ])
        // const res3 = target.apply(ctx, args)
        // const res5 = Array.prototype.filter === targetFn

        // if (typeof res === 'object') {
        //   return Reflect.apply(target, ctx, args)
        // }
        return res
      } finally {
        // AOP: after
        afterFn()
      }
    }
  })
}
