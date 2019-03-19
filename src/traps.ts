import Atom, { getSourceFromAtomProxy } from './Atom'
import Computed from './computed'
import { globalState } from './globalState'
import { $atomOfProxy, $getOriginSource, $isProxied } from './types'
import { aopFn, isPrimitive } from './utils'

const createTraps = (): ProxyHandler<Atom<any>> => {
  return {
    get(atom, prop, receiver) {
      // get value from source proxy
      const value = atom.get(prop)

      // internal method
      switch (prop) {
        case $isProxied:
          return true
        case $atomOfProxy:
          return atom
        case $getOriginSource:
          return value
      }

      // TODO: prop could be string | number | symbol, but now only consider string
      // NOTE: if a prop is not to be a observable property, it returns here
      // there deep properties will not be observable either, it stopped the recursive.
      if (atom.pickedProps.length > 0 && atom.pickedProps.indexOf(prop.toString()) < 0) {
        return value
      }

      // if it's already proxied, directly return the proxy
      if (atom.isPropProxied(prop as any)) {
        const existAtomOrComputed = atom.proxiedProps[prop]
        if (existAtomOrComputed instanceof Computed) {
          // it's a computed value
          return existAtomOrComputed.get()
        }
        return existAtomOrComputed.proxy
      }

      // primitive value: recursive end
      if (isPrimitive(value)) {
        return value
      }

      // method: recursive end
      if (typeof value === 'function') {
        return aopFn(value, globalState.enterSet, globalState.exitSet)
      }

      // recursive proxy
      const childAtom = new Atom(value)
      const childProxy = new Proxy<Atom<any>>(childAtom, createTraps())
      childAtom.proxy = childProxy
      atom.addProxiedProp(prop as any, childAtom)
      return childProxy
    },
    set(atom, prop, value, receiver) {
      globalState.enterSet()
      atom.set(prop, value)
      globalState.exitSet()
      return true
    },
    has(atom, property) {
      // SEE: https://stackoverflow.com/questions/40408917/array-prototype-foreach-not-working-when-called-on-a-proxy-with-a-get-handler
      return Reflect.has(atom.source, property)
    },
    getOwnPropertyDescriptor(key) {
      // TODO: should not just simple return
      return {
        enumerable: true,
        configurable: true
      }
    },
    ownKeys(atom) {
      // SEE: https://stackoverflow.com/questions/40352613/why-does-object-keys-and-object-getownpropertynames-produce-different-output
      const keys = Reflect.ownKeys(atom.source)
      return keys
    }
  }
}

export default createTraps
