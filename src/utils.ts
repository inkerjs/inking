import Atom from './Atom'
import { createHandler } from './handlers'

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

export function clearSubPathCache(m: Map<string, Atom>, parentPath: string) {
  const targetStarter = parentPath + '.'
  m.forEach((value, key, map) => {
    if (key.startsWith(targetStarter)) {
      map.delete(key)
    }
  })
}

export function replaceSubPathCache(pathCache: Map<string, Atom>, parentPath: string, newParentValue: Object) {
  const targetStarter = parentPath + '.'
  pathCache.forEach((value, key, map) => {
    if (key.startsWith(targetStarter)) {
      const subAtom = value
      const chainPath = key.split('.')
      const parentChainPath = parentPath.split('.')
      chainPath.splice(0, parentChainPath.length)
      let newValue = newParentValue
      chainPath.forEach(key => {
        newValue = newValue[key]
      })

      if (isPrimitive(newValue)) {
        const oldValue = subAtom.target
        if (oldValue !== newValue) {
          subAtom.target = newValue
          subAtom.reportChanged()
        }
      } else {
        const replaceProxy = new Proxy(newValue, createHandler(key, pathCache))
        subAtom.target = newValue
        subAtom.proxy = replaceProxy
      }
    }
  })
}

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
