import { computed } from './computed'
import { globalState } from './globalState'
import {
  getCurrCollectingComputedEffect,
  getCurrCollectingReactionEffect,
  resetCurrCollectingReactionEffect,
  setCurrCollectingReactionEffect,
  SideEffect
} from './observer'
import { $atomOfProxy, $getOriginSource, $isProxied, primitiveType } from './types'
import { defaultComparer, isNativeMethod, isPrimitive, makeFnInTransaction } from './utils'

export function isProxied(thing: any) {
  return !!thing[$isProxied]
}

export function getSourceFromAtomProxy(thing: any) {
  if (isProxied(thing)) {
    return thing[$getOriginSource]
  }
  return thing
}

export function getAtomOfProxy<T>(thing: T): Atom | T {
  if (isProxied(thing)) {
    return thing[$atomOfProxy]
  }
  return thing
}

export interface IChange {
  oldValue: any
  newValue: any
}

const sourceHandleCreator = (atom: Atom, reportChanged: Function) => {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop)
      // intercept getter
      const proto = Reflect.getPrototypeOf(target)
      const des = Reflect.getOwnPropertyDescriptor(proto, prop)
      if (des && des.get) {
        const getterFn = des.get.bind(atom.proxy)
        const newComputed = computed(getterFn)
        atom.addProxiedProp(prop, newComputed)
        return newComputed.get()
      }

      if (prop === $getOriginSource) {
        return target
      }

      if (isPrimitive(value)) {
        // dependency collection timing
        // register effect
        // === for reaction ===
        const currReactionSideEffect = getCurrCollectingReactionEffect()
        if (currReactionSideEffect) {
          atom.addReaction(prop as any, currReactionSideEffect)
        }
        // === for computed ===
        const currComputedSideEffect = getCurrCollectingComputedEffect()
        if (currComputedSideEffect) {
          atom.addReaction(prop as any, currComputedSideEffect)
        }
        return value
      }
      // a method should be treat as a transaction, so use Proxy to make AOP transaction hook
      if (typeof value === 'function') {
        let mayBoundFn = value
        if (isNativeMethod(prop, target[prop])) {
          // native method will directly modify source, so bind it to source
          mayBoundFn = value.bind(receiver)
        }

        return makeFnInTransaction(mayBoundFn)
      }

      // return a plain object to recursive make Atom
      return value
    },
    // native and external function will all call this setters
    set(target, prop, value, receiver) {
      const currPropInterceptor = atom.interceptors[prop]
      const oldValue = Reflect.get(target, prop, receiver)
      const newValue = value
      const defaultChange = {
        oldValue,
        newValue
      }
      let resultOfInterceptor: IChange
      if (typeof currPropInterceptor !== 'function') {
        // no interceptor
        resultOfInterceptor = defaultChange
      } else {
        resultOfInterceptor = currPropInterceptor(defaultChange)
      }

      // null means the change is intercepted
      if (resultOfInterceptor === null) return true
      // or normal change
      Reflect.set(target, prop, resultOfInterceptor.newValue, receiver)
      reportChanged(prop)
      return true
    }
  }
}

interface ISideEffects {
  [prop: string]: SideEffect[]
}

// TODO: Set, Map, WeakMap, primitive value
// But, what does it used for :-) ?
export type AtomType = `object` | `array`
// TODO: add generic <T> ?
class Atom {
  public id: string
  /**
   * original input plain object
   */
  public value: any
  public proxy!: any // TODO: type for a Proxy value is hard since proxy is transparent?
  public source!: object
  public isBeingTracked = false
  public proxiedProps = {}
  public sideEffects: ISideEffects = {}
  public atomType!: AtomType
  public interceptors = {}
  /**
   * only prop in pickedProps will be observable, used for @observable('a', 'b', 'c')
   * TODO: can pass a regex or a filter function
   */
  public pickedProps: string[] = []
  public computedProps: string[] = []

  public constructor(value: any) {
    this.value = value
    this.id = globalState.allocateAtomId()
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

  public addReaction = (prop: string | number, sideEffect: SideEffect | null) => {
    if (sideEffect === null) return

    if (Object.keys(this.proxiedProps).length === 0) {
      this.isBeingTracked = true
    }

    if (!Array.isArray(this.sideEffects[prop])) {
      this.sideEffects[prop] = []
    }

    if (this.sideEffects[prop].indexOf(sideEffect) <= 0) {
      this.sideEffects[prop].push(sideEffect)
    }
  }

  public removeReaction = (prop: string | number, effect: SideEffect) => {
    this.sideEffects[prop] = this.sideEffects[prop].filter((value, index, arr) => {
      return value !== effect
    })
  }

  public reportChanged = (prop: string | number) => {
    if (!this.sideEffects[prop]) {
      return
    }

    this.sideEffects[prop].forEach(sideEffect => {
      // isRunning transaction
      if (globalState.batchDeep > 0) {
        globalState.pendingReactions.add(sideEffect)
      } else {
        sideEffect.runInTrack(sideEffect.runEffectWithPredict)
      }
    })
  }
}

export default Atom
