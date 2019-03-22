import Atom from './Atom'
import { getPath, getPathCache } from './handlers'
import { accessStringPath, Lambda } from './utils'

export interface IChange {
  oldValue: any
  newValue: any
}

type IInterceptor = (IChange) => IChange | null

function interceptProperty(thing, prop, handler) {
  const pathCache = getPathCache(thing)
  if (!pathCache) return
  const parentPath = getPath(thing)
  if (parentPath === null) return
  const propPath = `${parentPath === '' ? '' : parentPath + '.'}${prop}`
  const _get = thing[prop] // touch it
  const targetAtom = pathCache.get(propPath)
  if (!targetAtom) return
  targetAtom.registerInterceptor(handler)

  return () => {
    targetAtom.resetInterceptor()
  }
}

// TODO: accept a `observable.box()` value
function interceptAtom(thing, handler) {}

export function intercept(obj: any, handler: IInterceptor): any
export function intercept(obj: any, property: string, handler: IInterceptor): Lambda

export function intercept(thing: any, propOrHandler, handler?): any {
  if (typeof handler === 'function') return interceptProperty(thing, propOrHandler, handler)
  return interceptAtom(thing, propOrHandler)
}
