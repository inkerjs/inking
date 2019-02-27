import Atom from './Atom'
import { once } from './utils'

let currentCollectingEffect: SideEffect | null = null
type ISideEffectType = `computed` | `reaction`
export let isPendingTransaction = false
export let pendingReactions: Set<any>

export interface IEffect {
  dependencies: Atom[]
  predictFn: (...args: any) => boolean
  sideEffectFn: Function
}

export const globalState = {
  batchDeep: 0
}

/**
 * Enter next batch.
 */
function startBatch() {
  if (globalState.batchDeep === 0) {
    // If starting a new queue from deep 0, clear the original queue.
    pendingReactions = new Set()
  }

  globalState.batchDeep++
  isPendingTransaction = true
  // globalState.event.emit('startBatch', null)
}

/**
 * Exit the current batch.
 */
function endBatch() {
  if (--globalState.batchDeep === 0) {
    // runPendingReactions()
    isPendingTransaction = false
    runPendingReactions()
  }

  // globalState.event.emit('endBatch', null)
}

function runPendingReactions() {
  // The number of queue executions.
  let currentRunCount = 0
  const MAX_COUNT = 999

  pendingReactions.forEach(reaction => {
    currentRunCount++

    if (currentRunCount >= MAX_COUNT) {
      pendingReactions.clear()
      return
    }

    reaction()
  })

  // Clear pending reactions.
  pendingReactions.clear()
}

export function Action(fn: () => any): void {
  return runInAction.call(null, fn)
}

function runInAction(fn: () => any | Promise<any>, debugName?: string) {
  // globalState.event.emit('runInAction', debugName)
  startBatch()
  try {
    return fn()
  } finally {
    endBatch()
  }
}

export class SideEffect implements IEffect {
  public type!: ISideEffectType
  public sideEffectFn
  public dependencies = []
  public constructor(fn: Function) {
    this.sideEffectFn = fn
  }
  public predictFn = () => true

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
