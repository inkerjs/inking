import { resetCurrCollectingEffect, setCurrCollectingEffect, SideEffect } from './observer'

type predicateType = (...args: any[]) => any

export const reaction = (collector: predicateType, fn: Function) => {
  const sideEffect = new SideEffect(fn)
  // `predicate` function will collect dependencies
  // `fn` is the real callback will be triggered
  setCurrCollectingEffect(sideEffect)
  collector()
  resetCurrCollectingEffect()
}
