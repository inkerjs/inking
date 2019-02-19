let currentCollectingReaction: any = null

export const getCurrCollectingReaction = () => {
  return currentCollectingReaction
}

export const autorun = (fn: (...args: any) => any) => {
  // collect dependency
  // TODO: if multi run, use promise to delay or give every reaction a id?
  currentCollectingReaction = fn
  fn()
  currentCollectingReaction = null
}
