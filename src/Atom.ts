import { SideEffect } from '../src/observer'
import { primitiveType } from './types'
import { defaultComparer } from './utils'

export type AtomType = `object` | `array` // TODO: Set, Map, WeakMap, primitive value

const sourceHandleCreator = changeCb => {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop)
      // native function will be bind and called directly
      if (typeof value === 'function') {
        return value.bind(receiver)
      }
      return value
    },
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
    this.source = new Proxy(value, sourceHandleCreator(this.reportChanged))
  }

  public isEqual: (oldValue: primitiveType, newValue: primitiveType) => boolean = (oldValue, newValue) => {
    return defaultComparer(oldValue, newValue)
  }

  public get(prop) {
    return this.source[prop]
  }

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

  public addReaction = (prop: string | number, fn: SideEffect | SideEffect[]) => {
    if (fn === null) return

    if (this.proxiedProps.length === 0) {
      this.isBeingTracked = true
    }

    if (!Array.isArray(this.sideEffects[prop])) {
      this.sideEffects[prop] = []
    }

    if (Array.isArray(fn)) {
      this.sideEffects[prop].push(...fn)
    } else {
      this.sideEffects[prop].push(fn)
    }
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
