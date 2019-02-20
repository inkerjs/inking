import Atom from './Atom'
import { getCurrCollectingReaction } from './observer'
import { $TINAR } from './types'
import { isPrimitive } from './utils'

const isInternalProp = (prop: number | string | symbol) => {
  return prop === $TINAR
}

const createTraps = (): ProxyHandler<any> => {
  return {
    get(target, prop, receiver) {
      const value = target.get(prop)

      if (target.isPropProxied(prop)) {
        const existAtom = target.proxiedProps[prop]
        return existAtom.proxy
      }

      if (isPrimitive(value)) {
        // 依赖收集，拿到 atom
        const currAtom: Atom = target
        const currReaction = getCurrCollectingReaction()
        currAtom.addReaction(currReaction)
        return value
      }

      const childAtom = new Atom(value)
      const childProxy = new Proxy(childAtom, createTraps())
      childAtom.proxy = childProxy
      target.addProxiedProp(prop, childAtom)
      return childProxy
    },
    set(target, prop, value, receiver) {
      return target.set(prop, value)
    }
  }
}

export default createTraps
