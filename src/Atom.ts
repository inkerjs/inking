import { SideEffect } from '../src/observer'
import { getCurrCollectingEffect, resetCurrCollectingEffect } from './observer'
import { primitiveType } from './types'
import { defaultComparer, once } from './utils'

export type AtomType = `object` | `array` // TODO: Set, Map, WeakMap, primitive value

const sourceHandleCreator = (atom: Atom, changeCb: Function) => {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop)
      // native function will be bind and called directly
      // register effect
      // FIXME:
      // const currSideEffect = getCurrCollectingEffect()
      // if (currSideEffect) {
      //   atom.addReaction(prop as any, currSideEffect)
      // }
      if (typeof value === 'function') {
        return value.bind(receiver)
      }
      return value
    },
    // native and external function will all call this setters
    set(target, prop, value, receiver) {
      const oldValue = Reflect.get(target, prop, receiver)
      const newValue = value
      Reflect.set(target, prop, value, receiver)
      changeCb(prop, oldValue, newValue)
      return true
    }
  }
}

interface ISideEffects {
  [prop: string]: SideEffect[]
}

// TODO: add generic <T> ?
class Atom {
  public proxy!: any // TODO: type for a Proxy value is hard since proxy is transparent?
  public source!: object
  public isBeingTracked = false
  public proxiedProps: (string | number | symbol)[] = []
  public sideEffects: ISideEffects = {}
  public atomType!: AtomType

  public constructor(value: any) {
    switch (true) {
      case Array.isArray(value):
        this.atomType = `array`
        break
      default:
        this.atomType = `object`
        break
    }
    this.source = new Proxy(value, sourceHandleCreator(this, this.reportChanged))
  }

  public isEqual: (oldValue: primitiveType, newValue: primitiveType) => boolean = (oldValue, newValue) => {
    return defaultComparer(oldValue, newValue)
  }

  public get(prop) {
    return this.source[prop]
  }

  // api for external(user) to set a value
  // native method modification will not call this method
  public set(prop, newValue) {
    if (this.source[prop] !== newValue) {
      this.source[prop] = newValue
    }
  }

  public addProxiedProp = (prop: string | number, atom: Atom) => {
    this.proxiedProps[prop] = atom
  }

  public isPropProxied = (prop: string | number) => {
    return Object.keys(this.proxiedProps).indexOf(prop.toString()) >= 0
  }

  public addReaction = (prop: string | number, handler: SideEffect) => {
    if (handler === null) return

    if (this.proxiedProps.length === 0) {
      this.isBeingTracked = true
    }

    if (!Array.isArray(this.sideEffects[prop])) {
      this.sideEffects[prop] = []
    }

    // const listeners = this.sideEffects[prop]
    // return once(() => {
    //   const idx = listeners.indexOf(handler)
    //   if (idx !== -1) listeners.splice(idx, 1)
    // })

    this.sideEffects[prop].push(handler)
  }

  public removeReaction = (prop: string | number, effect: SideEffect) => {
    this.sideEffects[prop] = this.sideEffects[prop].filter((value, index, arr) => {
      return value !== effect
    })
  }

  public reportChanged = (prop: string | number, oldVal, newVal) => {
    if (!this.sideEffects[prop]) {
      return
    }

    this.sideEffects[prop].forEach(sideEffect => {
      sideEffect.runEffect()
    })
  }
}

export default Atom
