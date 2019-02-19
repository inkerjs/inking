// import Atom from './Atom'
import Atom from './Atom'
import { getCurrCollectingReaction } from './observer'
import { $FROX } from './types'
import { isPrimitive } from './utils'

const isInternalProp = (prop: number | string | symbol) => {
  return prop === $FROX
}

const createTraps = (): ProxyHandler<any> => {
  return {
    get(target, prop, receiver) {
      const value = target.get(prop)
      // const value = Reflect.get(target, prop, receiver)

      // if (prop === $FROX) {
      //   return true
      // }

      if (target.isPropProxied(prop)) {
        const existAtom = target.proxiedProps[prop]
        return existAtom.proxy
      }

      if (isPrimitive(value)) {
        // 依赖收集
        // 先拿到 atom
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

      // if (isPrimitive(value)) {
      //   return value
      // }

      // if (prop === $FROX) {
      //   return true
      // }
      // // if it's a un-accessed prop, create a new atom and return its proxy
      // Reflect.set(target, $FROX, true)
      // Reflect.set(target, $PARENT, atom)

      // const childAtom = new Atom(value)
      // childAtom.prop = prop
      // return target.get(prop)
    },
    set(target, prop, value, receiver) {
      return target.set(prop, value)
      // const previous = Reflect.get(target, prop)
      // const currProp = prop.toString()
      // if (previous !== value) {
      //   // onchange
      //   console.log(`[${currProp}] changed`)
      // }

      // return true
    }
  }
}

export default createTraps
