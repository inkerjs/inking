import Atom from './Atom'
import { autorun, getCurrCollectingEffect, SideEffect } from './observer'
import { defaultComparer, IEqualsComparer, invariant } from './utils'

// TODO: implements part of Atom (so a common interface should be abstracted from Atom and implements by Atom and Computed)
export default class Computed {
  /**
   * real value of Computed
   */
  public value: any
  /**
   * for debug
   */
  public name?: string
  /**
   * function to express the computed value
   */
  public valueComputeFn: Function
  /**
   * Atoms this Computed dependents on
   */
  public observing: Atom[] = []
  /**
   * side effects dependents on this Computed
   */
  public sideEffects: SideEffect[] = []
  /**
   * comparer function, computed only will trigger its side effects when comparer return true
   */
  public equals: IEqualsComparer<any> = defaultComparer

  public constructor(initFn: Function) {
    this.valueComputeFn = initFn
    const boundRecompute = this.reComputeAndTrigger.bind(this)
    autorun(boundRecompute, 'computed')
  }

  public reComputeAndTrigger() {
    const oldValue = this.value
    this.value = this.valueComputeFn()

    // if computed is not being observed, DO NOT trigger following side effects
    if (this.sideEffects.length === 0) return
    if (!this.equals(oldValue, this.value)) {
      this.sideEffects.forEach(sideEffect => {
        sideEffect.runEffectWithPredict()
      })
    }
  }

  public get() {
    this.addReaction(getCurrCollectingEffect())
    return this.value
  }

  public addReaction = (handler: SideEffect | null) => {
    if (handler === null) return
    if (!Array.isArray(this.sideEffects)) {
      this.sideEffects = []
    }
    this.sideEffects.push(handler)
  }

  public set() {
    throw Error(`do not try to set a computed value, it's automatic computed.`)
  }
}

export interface IComputedValueOptions<T> {
  get?: () => T
  set?: (value: T) => void
  name?: string
  equals?: IEqualsComparer<T>
  // context?: any
  // requiresReaction?: boolean
  // keepAlive?: boolean
}

export const createComputed = (getFn: Function, options?: IComputedValueOptions<any>) => {
  const computed = new Computed(getFn)
  if (typeof options === 'object') {
    const { name, equals } = options
    if (typeof name === 'string') computed.name = name
    if (typeof equals === 'function') computed.equals = equals
  }
  return computed
}

/**
 * Decorator for class properties: @computed get value() { return expr; }.
 * For legacy purposes also invokable as ES5 observable created: `computed(() => expr)`;
 */
export const computed: any = function computed(arg1, arg2, arg3) {
  if (typeof arg2 === 'string') {
    // @computed
    // Class Model {...}
    // return computedDecorator.apply(null, arguments)
  }

  // computed(expr, options?)
  if (process.env.NODE_ENV !== 'production') {
    invariant(typeof arg1 === 'function', 'First argument to `computed` should be an expression.')
    invariant(arguments.length < 3, 'Computed takes one or two arguments if used as function')
  }
  return createComputed(arg1, arg2)
} as any
