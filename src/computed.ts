import Atom from './Atom'
import { autoUpdateComputedValue, getCurrCollectingReactionEffect, SideEffect } from './observer'
import { IDecoratorPropsRestArgs } from './types'
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
    autoUpdateComputedValue(boundRecompute, 'computed')
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
    // this.addReaction(getCurrCollectingReactionEffect())
    this.value = this.valueComputeFn()
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

function createComputedDecorator(props: IDecoratorPropsRestArgs) {
  let pickedProps: string[] = props as string[]

  return function decorateClassObservable(TargetClass: any) {
    // function wrap(...args: any[]) {
    //   const proxy = createProxyOfAtom(new TargetClass(...args))
    //   const atom = getAtomOfProxy(proxy) as Atom
    //   atom.pickedProps = pickedProps
    //   return proxy
    // }
    // return wrap as any
  }
}

// TODO: add IComputed type
export function computed(getFn: Function, options?: IComputedValueOptions<any>): any
export function computed(...args): any {
  // const c1 = computed(()=> {...})
  if (typeof args[0] === 'function') {
    return createComputed(args[0], args[1])
  }

  // @computed
  // Class Model {...}
  // TODO: Defensive programming
  return createComputedDecorator(args)
}
