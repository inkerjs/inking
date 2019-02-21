import Atom from './Atom'
let currentCollectingEffect: SideEffect | null = null

export interface IEffect {
  dependencies: Atom[]
  predictFn: (...args: any) => boolean
  sideEffectFn: Function
}

export class SideEffect implements IEffect {
  public sideEffectFn
  public dependencies = []
  public constructor(fn: Function) {
    this.sideEffectFn = fn
  }
  public predictFn = () => true // TODO: import an primitive equal function
  public runEffect = () => {
    if (this.predictFn()) {
      this.sideEffectFn()
    }
  }
}

export const getCurrCollectingEffect = () => {
  return currentCollectingEffect
}

export const resetCurrCollectingEffect = () => {
  currentCollectingEffect = null
}

export const autorun = (fn: any) => {
  // collect dependency
  // TODO: if multi run, use promise to delay or give every reaction a id?
  const sideEffect = new SideEffect(fn)
  currentCollectingEffect = sideEffect
  sideEffect.sideEffectFn()
  currentCollectingEffect = null
}

type predicateType = () => boolean

export const when = (predicate: predicateType, fn: Function) => {
  const sideEffect = new SideEffect(fn)
  sideEffect.predictFn = predicate
  // `predicate` function will collect dependencies
  // `fn` is the real callback will be triggered
  currentCollectingEffect = sideEffect
  predicate()
  currentCollectingEffect = null
}
