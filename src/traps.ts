import Atom from './Atom'
import Computed from './computed'
import { $atomOfProxy, $getOriginSource, $isProxied } from './types'
import { isPrimitive } from './utils'

const createTraps = (): ProxyHandler<Atom> => {
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
        return value
      }

      // recursive proxy
      const childAtom = new Atom(value)
      const childProxy = new Proxy<Atom>(childAtom, createTraps())
      childAtom.proxy = childProxy
      atom.addProxiedProp(prop as any, childAtom)
      return childProxy
    },
    set(atom, prop, value, receiver) {
      atom.set(prop, value)
      return true
    },
    ownKeys(atom) {
      // FIXME: mysterious bug with `Object.keys`
      const keys = Reflect.ownKeys(atom.source)
      return keys
    }
  }
}

export default createTraps
