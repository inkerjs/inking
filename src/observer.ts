let currentCollectingReaction: any = null

export const getCurrCollectingReaction = () => {
  return currentCollectingReaction
}

export const resetCurrCollectingReaction = () => {
  currentCollectingReaction = null
}

export const autorun = (fn: any) => {
  // collect dependency
  // TODO: if multi run, use promise to delay or give every reaction a id?
  currentCollectingReaction = fn
  fn()
  currentCollectingReaction = null
}
