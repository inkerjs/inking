import Atom from './Atom'
import { globalState } from './globalState'
import {
  autorun,
  getCurrCollectingReactionEffect,
  resetCurrCollectingComputedEffect,
  resetCurrCollectingReactionEffect,
  setCurrCollectingComputedEffect,
  setCurrCollectingReactionEffect,
  SideEffect
} from './observer'
import { IDecoratorPropsRestArgs } from './types'
import { defaultComparer, IEqualsComparer, invariant } from './utils'

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
  public innerSideEffect: SideEffect

  public constructor(initFn: Function) {
    this.valueComputeFn = initFn
    this.id = globalState.allocateDerivationId()
    const boundRecompute = this.reComputeAndTrigger.bind(this)
    const sideEffect = new SideEffect(boundRecompute)
    this.innerSideEffect = sideEffect
    sideEffect.type = 'computed'
    // setCurrCollectingReactionEffect(sideEffect)
    sideEffect.runInTrack(this.valueComputeFn)
    // resetCurrCollectingReactionEffect()
  }

  public reComputeAndTrigger() {
    // const oldValue = this.value
    // this.value = this.valueComputeFn()
    this.innerSideEffect.runInTrack(this.valueComputeFn)
    // if computed is not being observed, DO NOT trigger following side effects
    // if (!this.equals(oldValue, this.value)) {
    this.sideEffects.forEach(sideEffect => {
      globalState.simpleThunk.add(sideEffect)
      // sideEffect.runEffectWithPredict()
    })
    // }
  }

  public isStale() {
    const oldValue = this.value
    return !defaultComparer(oldValue, this.valueComputeFn())
  }

  public isEqual() {
    return this.equals(this.value, this.valueComputeFn())
  }

  public pureGetFreshValue() {
    return this.valueComputeFn()
  }

  public get() {
    // if (globalState.isRunningReactions) {
    //   return this.value
    // }
    const oldValue = this.value
    // could intercept version id check here
    globalState.accessIntoCom()
    const currReaction = getCurrCollectingReactionEffect()
    if (currReaction) {
      this.addReaction(currReaction)
      if (currReaction.dependencies.indexOf(this) < 0) {
        currReaction.dependencies.push(this)
      }
    }

    // this.value = this.valueComputeFn()
    if (currReaction) {
      currReaction.runInTrack(this.valueComputeFn)
    }
    this.value = this.valueComputeFn()
    globalState.leaveCom()
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
