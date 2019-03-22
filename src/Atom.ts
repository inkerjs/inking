import { globalState } from './globalState'
import { createHandler } from './handlers'
import { SideEffect } from './observer'
import { invariant, Lambda } from './utils'

export default class Atom {
  public path: string
  public target: any
  public interceptor?: Lambda
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

  public registerInterceptor = (interceptor: Lambda) => {
    this.interceptor = interceptor
  }

  public reportChanged = () => {
    this.sideEffects.forEach(sideEffect => {
      switch (sideEffect.type) {
        case 'computed':
          // computed should be directly "unzipped" to release the reactions
          sideEffect.runEffectWithPredict()
          break
        case 'reaction':
          globalState.simpleThunk.add(sideEffect)
          break
        default:
          invariant('type of side effect should be specified.')
      }
    })
  }
}
