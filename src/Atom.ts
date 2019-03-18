import Computed from './computed'
import { globalState } from './globalState'
import { getCurrCollectingReactionEffect, SideEffect } from './observer'
import { $atomOfProxy, $getOriginSource, $isProxied, primitiveType } from './types'
import { defaultComparer, isNativeMethod, isPrimitive } from './utils'

export function isProxied(thing: any) {
  return !!thing[$isProxied]
}

export function getSourceFromAtomProxy(thing: any) {
  if (isProxied(thing)) {
    return thing[$getOriginSource]
  }
  return thing
}

export function getAtomOfProxy<T>(thing: T): Atom<T> | T {
  if (isProxied(thing)) {
    return thing[$atomOfProxy]
  }
  return thing
}

export interface IChange {
  oldValue: any
  newValue: any
}

function sourceHandleCreator<T>(atom: Atom<T>, reportChanged: Function) {
  return {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop)
      // ⬇️ get(){ return ... } ⬇️
      const proto = Reflect.getPrototypeOf(target)
      const selfDescriptor = Reflect.getOwnPropertyDescriptor(target, prop)
      const protoDescriptor = Reflect.getOwnPropertyDescriptor(proto, prop)
      const getter = (selfDescriptor && selfDescriptor.get) || (protoDescriptor && protoDescriptor.get)
      if (getter) {
        const getterFn = getter.bind(atom.proxy)
        const newComputed = new Computed(getterFn)
        atom.addProxiedProp(prop, newComputed as any)
        const computedResult = newComputed.get()
        return computedResult
      }
      // ⬆️ get(){ return ... } ⬆️

      if (prop === $getOriginSource) {
        return target
      }

      if (isPrimitive(value)) {
        // dependency collection timing
        const currReactionSideEffect = getCurrCollectingReactionEffect()
        // NOTE: when collecting dependencies, the effect actually just dependent on computed value, so if it's collecting in accessing computed value, observable value should not be dependent

        if (currReactionSideEffect && globalState.computedAccessDepth === 0) {
          atom.addReaction(prop as any, currReactionSideEffect)
        }
        return value
      }

      if (typeof value === 'function') {
        // inplace operation, should be directly on source. If bind it onto atom, the change of length may lost in the procession
        const inplaceNativeMethod = ['shift', 'unshift', 'push', 'pop', 'concat']
        let mayBoundFn = value
        if (inplaceNativeMethod.indexOf(prop) >= 0) {
          mayBoundFn = value.bind(receiver)
          return mayBoundFn
        }

        mayBoundFn = value.bind(atom.proxy)
        // FIXME: why could not bind user-land method to receiver
        // if (isNativeMethod(prop, target[prop])) {
        // mayBoundFn = value.bind(receiver)
        // }

        return mayBoundFn
      }

      // return a plain object to recursive make Atom
      return value
    },
    // native and external function will all call this setters
    set(target, prop, value, receiver) {
      const currPropInterceptor = atom.interceptors[prop]
      const oldValue = Reflect.get(target, prop, receiver)

      let newValue = value

      // new proxy for new property object is coming
      if (atom.isPropProxied(prop)) {
        atom.proxiedProps[prop] = null
        delete atom.proxiedProps[prop]
      }

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
      globalState.enterSet()
      const oldLength = Reflect.get(target, 'length')
      Reflect.set(target, prop, resultOfInterceptor.newValue, receiver)
      const newLength = Reflect.get(target, 'length')
      // FIXME: hack, length is so easy to be modified by operation that not directly on `length` property
      // if (oldLength !== newLength) {
      //   reportChanged('length')
      // }
      globalState.exitSet()
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
class Atom<T> {
  public id: string
  /**
   * original input plain object
   */
  public raw: T
  public proxy!: T
  public source!: object
  // public isBeingTracked = false
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
    this.raw = value
    this.id = globalState.allocateAtomId()
    switch (true) {
      case Array.isArray(value):
        this.atomType = `array`
        break
      default:
        this.atomType = `object`
        break
    }
    this.source = new Proxy(value, sourceHandleCreator<T>(this, this.reportChanged))
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

  public addProxiedProp = (prop: string | number, atom: Atom<T>) => {
    this.proxiedProps[prop] = atom
  }

  public isPropProxied = (prop: string | number) => {
    return Object.keys(this.proxiedProps).indexOf(prop.toString()) >= 0
  }

  public addReaction = (prop: string | number, sideEffect: SideEffect | null) => {
    if (sideEffect === null) return

    // add atom to side effect's dependencies
    if (sideEffect.dependencies.indexOf(this) < 0) {
      sideEffect.dependencies.push(this)
    }

    // add side effect to atom's prop dependencies
    this.sideEffects[prop] = this.sideEffects[prop] || []
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
      // if (globalState.batchDepth > 0) {
      //   globalState.pendingReactions.add(sideEffect)
      // } else {
      // computed should be directly "unzipped" to release the reactions
      switch (sideEffect.type) {
        case 'computed':
          sideEffect.runEffectWithPredict()
          break
        default:
          // TODO: some reaction do not have a type, `case 'reaction'` bugs
          globalState.simpleThunk.add(sideEffect)
          break
      }
      // }
    })
  }
}

export default Atom
