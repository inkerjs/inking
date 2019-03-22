import { createHandler } from './handlers'
import { SideEffect } from './observer'

export default class Atom {
  public path: string
  public target: any
  public proxy: Object | null
  public sideEffects: SideEffect[] = []
  public constructor(path: string, target: any, proxy) {
    this.path = path
    this.target = target
    this.proxy = proxy
  }

  public addReaction = (reaction: SideEffect | undefined | null) => {
    if (reaction instanceof SideEffect && this.sideEffects.indexOf(reaction) < 0) {
      this.sideEffects.push(reaction)
    }
  }

  public inheritSideEffects = (oldSideEffects: SideEffect[]) => {
    this.sideEffects = oldSideEffects
  }
}
