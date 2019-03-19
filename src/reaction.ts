import { resetCurrCollectingReactionEffect, SideEffect, unshiftCurrCollectingReactionEffect } from './observer'

type predicateType = (...args: any[]) => any
type effectFn = (data: any) => any

export const reaction = (collector: predicateType, fn: effectFn) => {
  const sideEffect = new SideEffect('reaction', fn)
  sideEffect.dependenciesCollector = collector
  // `predicate` function will collect dependencies
  // `fn` is the real callback will be triggered
  unshiftCurrCollectingReactionEffect(sideEffect)
  collector()
  resetCurrCollectingReactionEffect()
}
