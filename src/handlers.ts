import Atom from './Atom'
import Computed from './computed'
import { globalState } from './globalState'
import { getCurrCollectingReactionEffect, SideEffect } from './observer'
import { $getOriginSource, $getPath, $getRootCache, $isProxied, $notGetter } from './types'
import { aopFn, clearSubPathCache, isPrimitive, replaceSubPathCache } from './utils'

const concatPath = (path, prop) => {
  let resPath = path
  if (prop && prop.toString) {
    if (resPath) {
      resPath += '.'
    }

    resPath += prop.toString()
  }
  return resPath
}

export function getPathCache(thing: any): Map<string, Atom> {
  return thing[$getRootCache] || null
}

export function getPath(thing: any): string | undefined {
  return thing[$getPath]
}

function handleGetter(
  target: any,
  prop: string,
  receiver: any,
  path: string,
  cachedAtom: any,
  pathCache: Map<string, Atom>
) {
  // getter
  const proto = Reflect.getPrototypeOf(target)
  const selfDescriptor = Reflect.getOwnPropertyDescriptor(target, prop)
  const protoDescriptor = Reflect.getOwnPropertyDescriptor(proto, prop)
  const getter = (selfDescriptor && selfDescriptor.get) || (protoDescriptor && protoDescriptor.get)
  if (getter) {
    if (cachedAtom instanceof Computed) {
      return cachedAtom.get()
    }
    const newComputed = new Computed(getter.bind(receiver))
    pathCache.set(path, newComputed as any)
    const computedResult = newComputed.get()
    return computedResult
  }

  return $notGetter
}

function relateAtomAndReaction(atom: Atom, reaction: SideEffect | null) {
  if (atom instanceof Atom && reaction instanceof SideEffect) {
    atom.addReaction(reaction, !globalState.isInCom())
    reaction.addDependency(atom, !globalState.isInCom())
  }
}

interface IHandlerOptions {
  pickedProps: string[]
}

/* tslint:disable:cyclomatic-complexity */
export function createHandler(parentPath: string, pathCache: Map<string, Atom>, options?: IHandlerOptions) {
  return {
    get(target, prop, receiver) {
      // internal assessor
      switch (prop) {
        case $getRootCache:
          return pathCache
        case $isProxied:
          return true
        case $getOriginSource:
          return target
        case $getPath:
          return parentPath
      }

      // ignore non-picked prop
      if (options && options.pickedProps) {
        if (options.pickedProps.indexOf(prop) < 0) {
          return Reflect.get(target, prop, receiver)
        }
      }

      // getter
      const path = concatPath(parentPath, prop)
      const cachedAtom = pathCache.get(path)
      const getterRes = handleGetter(target, prop, receiver, path, cachedAtom, pathCache)
      // priority handle getter
      if (getterRes !== $notGetter) return getterRes

      const value = Reflect.get(target, prop, receiver)
      const reaction = getCurrCollectingReactionEffect()

      if (typeof value === 'function') {
        // return reaction ? aopFn(value, globalState.enterSet, globalState.exitSet) : value
        return aopFn(value, globalState.enterSet, globalState.exitSet)
      }

      // === if cached ===
      if (cachedAtom) {
        // reaction is collecting
        relateAtomAndReaction(cachedAtom, reaction)
        if (isPrimitive(value)) return value
        return cachedAtom.proxy
      }

      // === if not cached ===
      // create primitive cache
      if (isPrimitive(value)) {
        const primitiveAtom = new Atom(path, value, null)
        primitiveAtom.addReaction(reaction)
        pathCache.set(path, primitiveAtom)
        relateAtomAndReaction(primitiveAtom, reaction)
        return value
      }

      // create object cache
      const proxy = new Proxy(value, createHandler(path, pathCache))
      const newAtom = new Atom(path, target, proxy)
      relateAtomAndReaction(newAtom, reaction)
      return proxy
    },

    set(target, prop, newValue, receiver) {
      globalState.enterSet()
      const path = concatPath(parentPath, prop)
      const oldValue = Reflect.get(target, prop, receiver)
      const oldAtom = pathCache.get(path)

      if (oldAtom) {
        const interceptRes = oldAtom.isIntercepted(oldValue, newValue)
        if (interceptRes) {
          return true
        }
      }

      const prevLength = Reflect.get(target, 'length', receiver)
      const result = Reflect.set(target, prop, newValue)
      const newLength = Reflect.get(target, 'length', receiver)

      // FIXME: hack for Array length
      if (Array.isArray(target)) {
        if (prop !== 'length' && prevLength !== newLength) {
          receiver.length = newLength
          const lengthPath = concatPath(parentPath, 'length')
          const lengthAtom = pathCache.get(lengthPath)
          if (lengthAtom) {
            lengthAtom.reportChanged(prevLength, newLength)
          }
        }
      }

      if (typeof newValue === 'object') {
        // replace with a new object
        const replaceProxy = new Proxy(newValue, createHandler(path, pathCache))
        const newAtom = new Atom(path, target, replaceProxy)
        if (oldAtom) {
          newAtom.inheritSideEffects(oldAtom.sideEffects)
        }
        pathCache.set(path, newAtom)
        replaceSubPathCache(pathCache, path, newValue)
      } else {
        // modify primitive value
        if (oldValue !== newValue) {
          if (oldAtom) {
            oldAtom.reportChanged(oldValue, newValue)
            clearSubPathCache(pathCache, path)
          }
        }
      }

      globalState.exitSet()
      return result
    }
  }
}

interface ICreateRootOptions {
  pickedProps: string[]
}

function createRootObservableRoot<T>(object: T, options?: ICreateRootOptions): T {
  const pathCache = new Map<string, Atom>()
  const rootHandlerOptions = options ? { pickedProps: options.pickedProps } : undefined
  const handler = createHandler('', pathCache, rootHandlerOptions)
  const proxy: T = new Proxy(object, handler)
  pathCache.set('', new Atom('', proxy, object))

  return proxy
}

function createRootOBoxRoot<T>(object: T, options?: ICreateRootOptions): T {
  const pathCache = new Map<string, Atom>()

  const handler = createHandler('', pathCache)
  const proxy: T = new Proxy(object, handler)
  pathCache.set('', new Atom('', proxy, object))

  return proxy
}

export default createRootObservableRoot
