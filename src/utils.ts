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

export function invariant(message: string): void
export function invariant(check: false, message?: string | boolean): never
export function invariant(check: any, message?: string | boolean): void
export function invariant(check: boolean | string, message?: string | boolean) {
  if (arguments.length === 1 && typeof check === 'string') throw new Error('[inking] ' + (check || OBFUSCATED_ERROR))
  if (!check) throw new Error('[inking] ' + (message || OBFUSCATED_ERROR))
}

export function clearSubPathCache(m: Map<string, Atom>, parentPath: string) {
  const targetStarter = parentPath + '.'
  m.forEach((value, key, map) => {
    if (key.startsWith(targetStarter)) {
      map.delete(key)
    }
  })
}

export function accessStringPath(path: string, target: any) {
  const chainPath = path.split('.')
  let newValue = target
  chainPath.forEach(key => {
    newValue = newValue[key]
  })
  return newValue
}

export function updateAtom(oldAtom: Atom, newValue: any, path: string, pathCache: Map<string, Atom>) {
  const oldValue = oldAtom.target
  oldAtom.target = newValue
  // update atom
  if (isPrimitive(newValue)) {
    oldAtom.type = 'primitive'
    oldAtom.proxy = null
  } else {
    oldAtom.type = 'object'
    const newProxy = new Proxy(newValue, createHandler(path, pathCache))
    oldAtom.proxy = newProxy
  }

  if (oldAtom.shouldShallowUpdate(oldValue, newValue)) {
    oldAtom.reportChanged(oldValue, newValue)
  }
}

export function replaceSubPathCache(pathCache: Map<string, Atom>, parentPath: string, newParentValue: Object) {
  const targetStarter = parentPath + '.'
  pathCache.forEach((subAtom: any, key: string) => {
    if (key.startsWith(targetStarter) || key === parentPath) {
      const chainPath = key.split('.')
      const parentChainPath = parentPath.split('.')
      chainPath.splice(0, parentChainPath.length)
      // may catch error here, but in expect
      let newValue = newParentValue
      chainPath.forEach(key => {
        newValue = newValue[key]
      })

      // new added props will do nothing
      // replaced props will inherit reactions
      updateAtom(subAtom, newValue, key, pathCache)
    }
  })
}

export function aop(targetFn: Function, beforeFn: Function, afterFn: Function) {
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
