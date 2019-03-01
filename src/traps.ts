import Atom from './Atom'
import { getCurrCollectingEffect, resetCurrCollectingEffect } from './observer'
import { isPrimitive } from './utils'

export interface ITrapsOptions {
  allowToSet: boolean
}

export const defaultAtomTrapsOption: ITrapsOptions = {
  allowToSet: true
}

export const defaultComputedTrapsOption: ITrapsOptions = {
  allowToSet: false
}

const createTraps = (options: ITrapsOptions = defaultAtomTrapsOption): ProxyHandler<Atom> => {
  return {
    get(target, prop) {
      // get value from proxy source
      const value = target.get(prop)

      // if it's already proxied, directly return the proxy
      if (target.isPropProxied(prop as any)) {
        const existAtom = target.proxiedProps[prop]
        return existAtom.proxy
      }

      // primitive value: recursive end
      if (isPrimitive(value)) {
        return value
      }

      // native method: recursive end
      if (typeof value === 'function') {
        return value
      }

      // recursive proxy
      const childAtom = new Atom(value)
      const childProxy = new Proxy<Atom>(childAtom, createTraps())
      childAtom.proxy = childProxy
      target.addProxiedProp(prop as any, childAtom)
      return childProxy
    },
    set(target, prop, value, receiver) {
      target.set(prop, value)
      return true
    }
  }
}

export default createTraps
