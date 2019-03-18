import Atom from './Atom'
import Computed from './computed'
import { globalState } from './globalState'

let currentCollectingReactionEffect: SideEffect[] | null = null
type SideEffectType = `computed` | `reaction`

export interface IEffect {
  dependencies: Atom<any>[]
  predictFn: (...args: any) => boolean
  sideEffectFn: Function
}

// export function startBatch() {
//   if (globalState.batchDepth === 0) {
//     // If starting a new queue from deep 0, clear the original queue.
//     globalState.pendingReactions = new Set()
//   }

//   globalState.batchDepth++
//   globalState.isPendingTransaction = true
// }

// export function endBatch() {
//   if (--globalState.batchDepth === 0) {
//     globalState.isPendingTransaction = false
//     runPendingReactions()
//   }
// }

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
    unshiftCurrCollectingReactionEffect(this)
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

  public addDependency = (dependency: Atom<any> | Computed) => {
    if (this.dependencies.indexOf(dependency) < 0) {
      this.dependencies.push(dependency)
    }
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

// === reaction accessor ===
export const getCurrCollectingReactionEffect = () =>
  currentCollectingReactionEffect === null ? null : currentCollectingReactionEffect[0]

export const unshiftCurrCollectingReactionEffect = (effect: SideEffect) =>
  currentCollectingReactionEffect === null
    ? (currentCollectingReactionEffect = [effect])
    : currentCollectingReactionEffect.unshift(effect)

export const resetCurrCollectingReactionEffect = () => {
  if (Array.isArray(currentCollectingReactionEffect)) {
    currentCollectingReactionEffect.shift()
    if (currentCollectingReactionEffect.length === 0) {
      currentCollectingReactionEffect = null
    }
  }
}
// === reaction accessor ===

export const autorun = (fn: any, type: SideEffectType = 'reaction') => {
  // collect dependency
  // TODO: if multi run, use promise to delay or give every reaction a id?
  const sideEffect = new SideEffect(fn)
  sideEffect.type = type
  sideEffect.runInTrack(sideEffect.sideEffectFn)
}
