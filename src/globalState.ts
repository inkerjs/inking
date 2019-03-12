import { SideEffect } from './observer'

let _atomId = 0
let _derivationId = 0
let _reactionId = 0
let _setDeep = 0

export const globalState = {
  enterSet() {
    _setDeep++
  },
  exitSet() {
    _setDeep--
    if (_setDeep === 0) {
      console.log('set deep === 0')
    }
  },
  /**
   * id of atom, it's unique
   */
  allocateAtomId() {
    const currAtomId = _atomId
    _atomId++
    return `[atom] ${currAtomId}`
  },
  /**
   * id of atom, it's unique
   */
  allocateDerivationId() {
    const currDerivationId = _derivationId
    _derivationId++
    return `[derivation] ${currDerivationId}`
  },
  allocateReactionId() {
    const currReactionId = _reactionId
    _reactionId++
    return `[reaction] ${currReactionId}`
  },
  /**
   * is in transaction
   */
  isPendingTransaction: false,
  /**
   * transaction depth
   */
  batchDeep: 0,
  /**
   * pending reactions
   */
  pendingReactions: new Set<SideEffect>(),
  /**
   * 
   */
  simpleThunk: []
}
