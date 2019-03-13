import Atom from './Atom'
import { globalState } from './globalState'
import { getCurrCollectingReactionEffect, SideEffect } from './observer'
import { IDecoratorPropsRestArgs } from './types'
import { defaultComparer, IEqualsComparer } from './utils'

// TODO: implements part of Atom (so a common interface should be abstracted from Atom and implements by Atom and Computed)
export default class Computed {
  /**
   * id
   */
  public id: string
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
  /**
   * the internal assist SideEffect of each Computed
   */
  public internalSideEffect: SideEffect

  public constructor(initFn: Function) {
    this.valueComputeFn = initFn
    this.id = globalState.allocateDerivationId()
    const boundRecompute = this.reCollectAndTriggerSideEffects.bind(this)
    // Each Computed has a SideEffect corresponding to it.
    // The SideEffect collects on valueComputeFn and it's side effect is run Computed's sideEffect.
    const sideEffect = new SideEffect(boundRecompute)
    sideEffect.type = 'computed'
    this.internalSideEffect = sideEffect
    // collect dependencies
    this.collect()
  }

  public collect() {
    this.internalSideEffect.runInTrack(this.valueComputeFn)
  }

  public reCollectAndTriggerSideEffects() {
    // re-collect
    this.collect()
    this.sideEffects.forEach(sideEffect => {
      globalState.simpleThunk.add(sideEffect)
    })
  }

  public isEqual() {
    return this.equals(this.value, this.valueComputeFn())
  }

  public isStale() {
    const oldValue = this.value
    return !defaultComparer(oldValue, this.valueComputeFn())
  }

  public pureGetFreshValue() {
    return this.valueComputeFn()
  }

  public refreshValue() {
    return (this.value = this.pureGetFreshValue())
  }

  // get() will refresh the computed value
  public get() {
    globalState.intoCom()
    const currReaction = getCurrCollectingReactionEffect()
    // 1. add dependency to current reaction.
    if (currReaction) {
      this.addReaction(currReaction)
      currReaction.addDependency(this)
      // currReaction.runInTrack(this.valueComputeFn)
    }

    // 2. return a fresh value.
    this.value = this.pureGetFreshValue()
    globalState.leaveCom()
    return this.value
  }

  public addReaction = (sideEffect: SideEffect | null) => {
    if (sideEffect === null) return
    this.sideEffects.push(sideEffect)
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
  // let pickedProps: string[] = props as string[]

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
