import Atom from './Atom'
import Computed from './computed'
import { globalState } from './globalState'
import { getCurrCollectingReactionEffect, SideEffect } from './observer'
import { $getOriginSource, $getPath, $getRootCache, $isProxied, $notGetter } from './types'
import { aop, clearSubPathCache, isPrimitive, replaceSubPathCache } from './utils'

const concatPath = (basePath: string, prop: string): string => {
  let resPath = basePath
  if (typeof prop === 'string' && typeof basePath === 'string') {
    resPath += resPath === '' ? prop.toString() : `.${prop.toString()}`
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

export function createHandler(parentPath: string, pathCache: Map<string, Atom>, options?: IHandlerOptions) {
  return {
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)
      const reaction = getCurrCollectingReactionEffect()
      if (reaction) {
        const ownKeysPath = `${parentPath}.$$$ownKeys`
        const atom = new Atom(ownKeysPath, keys, null)
        pathCache.set(ownKeysPath, atom)
        relateAtomAndReaction(atom, reaction)
      }
      return keys
    },
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
        return aop(value, globalState.enterSet, globalState.exitSet)
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
        primitiveAtom.type = 'primitive'
        pathCache.set(path, primitiveAtom)
        relateAtomAndReaction(primitiveAtom, reaction)
        return value
      }

      // create object cache
      const proxy = new Proxy(value, createHandler(path, pathCache))
      const newAtom = new Atom(path, value, proxy)
      newAtom.type = 'object'
      pathCache.set(path, newAtom)
      relateAtomAndReaction(newAtom, reaction)
      return proxy
    },

    set(target, prop, newValue, receiver) {
      globalState.enterSet()
      const path = concatPath(parentPath, prop)
      const oldValue = Reflect.get(target, prop, receiver)
      const oldAtom = pathCache.get(path)

      // add a new prop
      if (Object.keys(target).indexOf(prop) < 0) {
        const ownKeysAtom = pathCache.get(`${parentPath}.$$$ownKeys`)
        if (ownKeysAtom) {
          ownKeysAtom.reportChanged(null, null)
        }
      }

      // intercept
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

      replaceSubPathCache(pathCache, path, newValue)
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
  const newAtom = new Atom('', proxy, object)
  newAtom.type = 'object'
  pathCache.set('', newAtom)

  return proxy
}

// function createRootOBoxRoot<T>(object: T, options?: ICreateRootOptions): T {
//   const pathCache = new Map<string, Atom>()

//   const handler = createHandler('', pathCache)
//   const proxy: T = new Proxy(object, handler)
//   pathCache.set('', new Atom('', proxy, object))

//   return proxy
// }

export default createRootObservableRoot
