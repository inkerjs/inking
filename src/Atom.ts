import { globalState } from './globalState'
import { endBatch, getCurrCollectingEffect, SideEffect, startBatch } from './observer'
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

export function getAtomFromProxy<T>(thing: T): Atom | T {
  if (isProxied(thing)) {
    return thing[$atomOfProxy]
  }
  return thing
}

export interface IChange {
  oldValue: any
  newValue: any
}

// TODO: Set, Map, WeakMap, primitive value
// But, what does it used for :-) ?
export type AtomType = `object` | `array`

const sourceHandleCreator = (atom: Atom, reportChanged: Function) => {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop)

      if (prop === $getOriginSource) {
        return target
      }

      if (isPrimitive(value)) {
        // dependency collection timing
        // register effect
        const currSideEffect = getCurrCollectingEffect()
        if (currSideEffect) {
          atom.addReaction(prop as any, currSideEffect)
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
      // TODO: interceptor here?
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

// TODO: add generic <T> ?
class Atom {
  /**
   * original input plain object
   */
  public value: any
  public proxy!: any // TODO: type for a Proxy value is hard since proxy is transparent?
  public source!: object
  public isBeingTracked = false
  public proxiedProps: (string | number | symbol)[] = []
  public sideEffects: ISideEffects = {}
  public atomType!: AtomType
  public interceptors = {}

  public constructor(value: any) {
    this.value = value
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

  public addReaction = (prop: string | number, handler: SideEffect | null) => {
    if (handler === null) return

    if (this.proxiedProps.length === 0) {
      this.isBeingTracked = true
    }

    if (!Array.isArray(this.sideEffects[prop])) {
      this.sideEffects[prop] = []
    }

    this.sideEffects[prop].push(handler)
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
        sideEffect.runEffectWithPredict()
      }
    })
  }
}

export default Atom
