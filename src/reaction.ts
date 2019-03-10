import { resetCurrCollectingReactionEffect, setCurrCollectingReactionEffect, SideEffect } from './observer'

type predicateType = (...args: any[]) => any
type effectFn = (data: any) => any

export const reaction = (collector: predicateType, fn: effectFn) => {
  const sideEffect = new SideEffect(fn)
  sideEffect.dependenciesCollector = collector
  // `predicate` function will collect dependencies
  // `fn` is the real callback will be triggered
  setCurrCollectingReactionEffect(sideEffect)
  collector()
  resetCurrCollectingReactionEffect()
}
