import Atom from './Atom'
import Computed, { computed } from './computed'
import { SideEffect } from './observer'

let _atomId = 0
let _derivationId = 0
let _reactionId = 0
let _setDeep = 0

export const globalState = {
  rootCache: new WeakMap<Object, string[]>(),
  /**
   * indication is it in final reaction running
   */
  isRunningReactions: false,
  /**
   * how depth we are accessing in nested computed value
   */
  computedAccessDepth: 0,
  /**
   * is in transaction
   */
  isPendingTransaction: false,
  /**
   * pending reactions
   */
  pendingReactions: new Set<SideEffect>(),
  /**
   * TODO: relationship with pending reactions?
   */
  simpleThunk: new Set<SideEffect>(),
  enterCom() {
    /* tslint:disable:no-invalid-this */
    globalState.computedAccessDepth++
  },
  exitCom() {
    globalState.computedAccessDepth--
  },
  isInCom() {
    return this.computedAccessDepth > 0
  },
  enterSet() {
    _setDeep++
  },
  exitSet() {
    _setDeep--
    if (_setDeep === 0) {
      // console.log('⬆️️️️️️️⬆️⬆️')
      _setDeep = -1 // HACK:
      globalState.isRunningReactions = true
      // const computedNeedToUpdate: Computed[] = []
      globalState.simpleThunk.forEach((sideEffect: SideEffect) => {
        const currSideEffectDependencies = sideEffect.dependencies
        let shouldTrigger = false
        for (const dependency of currSideEffectDependencies) {
          if (dependency instanceof Atom) {
            shouldTrigger = true
            // if atom changed, it definitely got a change
            // do not need to check if should trigger anymore
          }

          if (dependency instanceof Computed) {
            if (dependency.isStale() && !dependency.isEqual()) {
              // computedNeedToUpdate.push(dependency)
              shouldTrigger = true
            }
            dependency.refreshStaleValue()
          }
        }
        if (shouldTrigger) {
          sideEffect.runInTrack(sideEffect.runEffectWithPredict)
        }
      })
      // everything is done, gonna ending this updating
      // computedNeedToUpdate.forEach(com => com.refreshValue())
      globalState.simpleThunk.clear()
      globalState.isRunningReactions = false
      _setDeep = 0
    }
  },
  /**
   * unique ID of Atom
   */
  allocateAtomId() {
    const currAtomId = _atomId
    _atomId++
    return `[atom] ${currAtomId}`
  },
  /**
   * unique ID of Derivation(Computed)
   */
  allocateDerivationId() {
    const currDerivationId = _derivationId
    _derivationId++
    return `[derivation] ${currDerivationId}`
  },
  /**
   * unique ID of Reaction
   */
  allocateReactionId() {
    const currReactionId = _reactionId
    _reactionId++
    return `[reaction] ${currReactionId}`
  }
}
