import Atom from './Atom'
import Computed from './computed'
import { globalState } from './globalState'
import { defaultComparer } from './utils'

let currentCollectingReactionEffect: SideEffect[] | null = null
let currentCollectingComputedEffect: SideEffect | null = null
type SideEffectType = `computed` | `reaction`

export interface IEffect {
  dependencies: Atom[]
  predictFn: (...args: any) => boolean
  sideEffectFn: Function
}

export function startBatch() {
  if (globalState.batchDeep === 0) {
    // If starting a new queue from deep 0, clear the original queue.
    globalState.pendingReactions = new Set()
  }

  globalState.batchDeep++
  globalState.isPendingTransaction = true
}

export function endBatch() {
  if (--globalState.batchDeep === 0) {
    // runPendingReactions()
    globalState.isPendingTransaction = false
    runPendingReactions()
  }
}

export function runPendingReactions() {
  // The number of queue executions.
  let currentRunCount = 0
  const MAX_COUNT = 999

  globalState.pendingReactions.forEach(sideEffect => {
    currentRunCount++

    if (currentRunCount >= MAX_COUNT) {
      globalState.pendingReactions.clear()
      return
    }
    // FIXME: this is just a circumvention
    // if (sideEffect.type === 'computed') {
    //   return
    // }
    sideEffect.runEffectWithPredict()
  })

  // Clear pending reactions.
  globalState.pendingReactions.clear()
}

export class SideEffect implements IEffect {
  public id: string = globalState.allocateReactionId()
  public type!: SideEffectType // TODO: assign it in constructor
  /**
   * for `reaction`, `when`, this is the first function argument
   */
  public dependenciesCollector: ((...args: any[]) => any) | null = null
  /**
   * the real side effect function should be invoked
   * TODO: distinguish `dependenciesCollector` & `sideEffectFn` for `autorun`?
   */
  public sideEffectFn
  /**
   * for `computed`, the dependencies who dependent on this effect
   */
  public dependencies: any[] = []
  public isInTracking = false
  public constructor(fn: Function) {
    this.sideEffectFn = fn
  }
  public predictFn = () => true

  public startTrack = () => {
    this.isInTracking = true
    setCurrCollectingReactionEffect(this)
  }

  public endTrack = () => {
    this.isInTracking = false
    resetCurrCollectingReactionEffect()
  }
  public runInTrack = (collectFn: Function) => {
    this.startTrack()
    const hasAheadStoppedTracking = collectFn()
    if (hasAheadStoppedTracking === true) return
    this.endTrack()
  }

  public runEffectWithPredict = (): boolean => {
    let hasAheadStoppedTracking = false
    if (this.predictFn()) {
      // pass arguments
      // TODO: should pass arguments no matter what effect type is?
      let collectorRes = null
      if (typeof this.dependenciesCollector === 'function') {
        collectorRes = this.dependenciesCollector()
        if (this.isInTracking) {
          hasAheadStoppedTracking = true
          this.endTrack()
        }
      }
      this.sideEffectFn(collectorRes)
    }
    return hasAheadStoppedTracking
  }
}

// === reaction ===
export const getCurrCollectingReactionEffect = () => {
  if (currentCollectingReactionEffect) {
    return currentCollectingReactionEffect[0]
  }
  return currentCollectingComputedEffect
}

export const setCurrCollectingReactionEffect = (effect: SideEffect) => {
  if (currentCollectingReactionEffect === null) {
    currentCollectingReactionEffect = [effect]
  } else {
    currentCollectingReactionEffect.unshift(effect)
  }
}

export const resetCurrCollectingReactionEffect = () => {
  if (Array.isArray(currentCollectingReactionEffect)) {
    currentCollectingReactionEffect.shift()
    if (currentCollectingReactionEffect.length === 0) {
      currentCollectingReactionEffect = null
    }
  }
}
// === reaction ===

// === computed ===
export const getCurrCollectingComputedEffect = () => {
  return currentCollectingComputedEffect
}

export const setCurrCollectingComputedEffect = (effect: SideEffect) => {
  currentCollectingComputedEffect = effect
}

export const resetCurrCollectingComputedEffect = () => {
  currentCollectingComputedEffect = null
}
// === computed ===

export const autorun = (fn: any, type: SideEffectType = 'reaction') => {
  // collect dependency
  // TODO: if multi run, use promise to delay or give every reaction a id?
  const sideEffect = new SideEffect(fn)
  sideEffect.type = type
  sideEffect.runInTrack(sideEffect.sideEffectFn)
}
