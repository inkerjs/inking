import Atom from './Atom'
import { getCurrCollectingReaction } from './observer'
import { isPrimitive } from './utils'

const createTraps = (): ProxyHandler<Atom> => {
  return {
    get(target, prop) {
      // get value from atom
      const value = target.get(prop)
      // if it's already proxied, directly return the proxy
      if (target.isPropProxied(prop)) {
        const existAtom = target.proxiedProps[prop]
        return existAtom.proxy
      }

      // primitive value: recursive end
      if (isPrimitive(value)) {
        // dependency collection time
        const currAtom = target
        const currReaction = getCurrCollectingReaction()
        currAtom.addReaction(currReaction)
        return value
      }

      // recursive proxy
      const childAtom = new Atom(value)
      const childProxy = new Proxy<Atom>(childAtom, createTraps())
      childAtom.proxy = childProxy
      target.addProxiedProp(prop, childAtom)
      return childProxy
    },
    set(target, prop, value, receiver) {
      target.set(prop, value)
      return true
    }
  }
}

export default createTraps
