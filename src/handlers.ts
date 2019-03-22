import Atom from './Atom'
import Computed from './computed'
import { globalState } from './globalState'
import { getCurrCollectingReactionEffect, SideEffect } from './observer'
import { $getOriginSource, $isProxied } from './types'
import { aopFn, invariant, replaceSubPathCache } from './utils'

const isPrimitive = value => value === null || (typeof value !== 'object' && typeof value !== 'function')

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

/* tslint:disable:cyclomatic-complexity */
export function createHandler(parentPath: string, pathCache: Map<string, Atom>) {
  return {
    get(target, prop, receiver) {
      if (prop === $isProxied) {
        return true
      }

      if (prop === $getOriginSource) {
        return target
      }

      const path = concatPath(parentPath, prop)
      // getter
      const proto = Reflect.getPrototypeOf(target)
      const selfDescriptor = Reflect.getOwnPropertyDescriptor(target, prop)
      const protoDescriptor = Reflect.getOwnPropertyDescriptor(proto, prop)
      const cachedAtom = pathCache.get(path)
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

      const reaction = getCurrCollectingReactionEffect()
      const value = Reflect.get(target, prop, receiver)

      if (prop === proxyTarget) {
        return target
      }

      if (typeof value === 'function') {
        // return reaction ? aopFn(value, globalState.enterSet, globalState.exitSet) : value
        return aopFn(value, globalState.enterSet, globalState.exitSet)
      }

      // if cached
      if (cachedAtom) {
        if (reaction && cachedAtom.sideEffects.indexOf(reaction) < 0) {
          if (globalState.computedAccessDepth === 0) {
            cachedAtom.sideEffects.push(reaction)
            reaction.addDependency(cachedAtom)
          }
        }

        if (isPrimitive(value)) return value

        return cachedAtom.proxy
      }

      // if not cached

      // create primitive cache
      if (isPrimitive(value) || prop === 'constructor') {
        const primitiveAtom = new Atom(path, value, null)
        primitiveAtom.addReaction(reaction)
        pathCache.set(path, primitiveAtom)

        if (reaction) {
          if (globalState.computedAccessDepth === 0) {
            reaction.addDependency(primitiveAtom)
          }
        }
        return value
      }

      // create object cache
      const proxy = new Proxy(value, createHandler(path, pathCache))
      const newAtom = new Atom(path, target, proxy)
      newAtom.addReaction(reaction)
      pathCache.set(path, newAtom)
      if (reaction) {
        if (globalState.computedAccessDepth === 0) {
          reaction.addDependency(newAtom)
        }
      }
      return proxy

      // Preserve invariants
      // const descriptor = getOwnpropDescriptor(target, prop)
      // if (descriptor && !descriptor.configurable) {
      //   if (descriptor.set && !descriptor.get) {
      //     return undefined
      //   }

      //   if (descriptor.writable === false) {
      //     return value
      //   }
      // }
    },

    set(target, prop, newValue, receiver) {
      globalState.enterSet()
      if (newValue && newValue[proxyTarget] !== undefined) {
        /* tslint:disable */
        newValue = newValue[proxyTarget]
      }

      const path = concatPath(parentPath, prop)
      const prevValue = Reflect.get(target, prop, receiver)
      // FIXME: hack for length
      const prevLength = Reflect.get(target, 'length', receiver)
      const result = Reflect.set(target, prop, newValue)
      const newLength = Reflect.get(target, 'length', receiver)
      if (prop !== 'length' && prevLength !== newLength) {
        receiver.length = newLength
        const lengthPath = concatPath(parentPath, 'length')
        const lengthAtom = pathCache.get(lengthPath)
        if (lengthAtom) {
          lengthAtom.reportChanged()
        }
      }

      const oldAtom = pathCache.get(path)
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
        if (prevValue !== newValue) {
          if (oldAtom) {
            oldAtom.reportChanged()
          }
        }
      }

      globalState.exitSet()
      return result
    }

    // defineprop(target, prop, descriptor) {
    //   const result = Reflect.defineprop(target, prop, descriptor)
    //   invalidateCachedDescriptor(target, prop)

    //   handleChange(pathCache.get(target), prop, undefined, descriptor.value)

    //   return result
    // },

    // deleteprop(target, prop) {
    //   const previous = Reflect.get(target, prop)
    //   const result = Reflect.deleteprop(target, prop)
    //   invalidateCachedDescriptor(target, prop)

    //   handleChange(pathCache.get(target), prop, previous)

    //   return result
    // },

    // apply(target, thisArg, argumentsList) {
    //   if (!inApply) {
    //     inApply = true

    //     const result = Reflect.apply(target, thisArg, argumentsList)

    //     if (changed) {
    //       onChange()
    //     }

    //     inApply = false
    //     changed = false

    //     return result
    //   }

    //   return Reflect.apply(target, thisArg, argumentsList)
    // }
  }
}

const proxyTarget = Symbol('ProxyTarget')

const createRootObservable = object => {
  let inApply = false
  let changed = false
  const observableCache = new WeakMap()
  const propCache = new WeakMap()
  const pathCache = new Map<string, Atom>()

  // const handleChange = (path, prop, previous, value?) => {
  //   if (!inApply) {
  //     onChange.call(proxy, concatPath(path, prop), value, previous)
  //   } else if (!changed) {
  //     changed = true
  //   }
  // }

  // const getOwnpropDescriptor = (target, prop) => {
  //   let props = propCache.get(target)

  //   if (props) {
  //     return props
  //   }

  //   props = new Map()
  //   propCache.set(target, props)

  //   let prop = props.get(prop)
  //   if (!prop) {
  //     prop = Reflect.getOwnpropDescriptor(target, prop)
  //     props.set(prop, prop)
  //   }

  //   return prop
  // }

  // const invalidateCachedDescriptor = (target, prop) => {
  //   const props = propCache.get(target)

  //   if (props) {
  //     props.delete(prop)
  //   }
  // }

  const handler = createHandler('', pathCache)
  const proxy = new Proxy(object, handler)
  pathCache.set('', new Atom('', proxy, object))

  return proxy
}

export default createRootObservable
