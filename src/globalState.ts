import { SideEffect } from './observer'

export const globalState = {
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
  pendingReactions: new Set<SideEffect>()
}
