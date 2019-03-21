import { globalState } from './globalState'
import { getCurrCollectingReactionEffect, SideEffect } from './observer'
import { invariant } from './utils'

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

const reportChanged = (atom: IAtom | undefined) => {
  if (!atom) {
    invariant('should not set an undefined atom')
    return
  }

  atom.sideEffects.forEach(sideEffect => {
    switch (sideEffect.type) {
      case 'computed':
        // computed should be directly "unzipped" to release the reactions
        sideEffect.runEffectWithPredict()
        break
      case 'reaction':
        globalState.simpleThunk.add(sideEffect)
        break
      default:
        invariant('type of side effect should be specified.')
    }
  })
}

function createHandler(root, parentPath: string, pathCache: Map<string, IAtom>) {
  return {
    get(target, prop, receiver) {
      const reaction = getCurrCollectingReactionEffect()
      if (prop === proxyTarget) {
        return target
      }

      const value = Reflect.get(target, prop, receiver)
      const path = concatPath(parentPath, prop)

      if (isPrimitive(value) || prop === 'constructor') {
        pathCache.set(path, { target, proxy: null, sideEffects: reaction ? [reaction] : [] })
        return value
      }

      const cachedAtom = pathCache.get(path)
      if (cachedAtom) {
        if (reaction && cachedAtom.sideEffects.indexOf(reaction) < 0) {
          cachedAtom.sideEffects.push(reaction)
          reaction.addDependency(cachedAtom)
        }

        return cachedAtom.proxy
      }

      // first time, make a new proxy
      const proxy = new Proxy(value, createHandler(root, path, pathCache))
      const newAtom = { target, proxy, sideEffects: reaction ? [reaction] : [] }
      pathCache.set(path, newAtom)
      if (reaction) {
        reaction.addDependency(newAtom)
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
      const result = Reflect.set(target, prop, newValue)
      const atom = pathCache.get(path)

      if (prevValue !== newValue) {
        reportChanged(atom)
        console.log(path)
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

export interface IAtom {
  target: Object
  proxy: Object | null
  sideEffects: SideEffect[]
}
const proxyTarget = Symbol('ProxyTarget')

const onChange = object => {
  let inApply = false
  let changed = false
  const observableCache = new WeakMap()
  const propCache = new WeakMap()
  const pathCache = new Map<string, IAtom>()

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

  const handler = createHandler(object, '', pathCache)
  const proxy = new Proxy(object, handler)
  pathCache.set('', { target: object, proxy, sideEffects: [] })

  return proxy
}

export default onChange
